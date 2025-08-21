import { useEffect, useRef, useState } from "react";
import "./newPrompt.css";
import Upload from "../upload/Upload";
import { IKImage } from "imagekitio-react";
import model from "../../lib/gemini";
import Markdown from "react-markdown";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const NewPrompt = ({ data }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [img, setImg] = useState({
    isLoading: false,
    error: "",
    dbData: {},
    aiData: {},
  });

  const sanitizedHistory = (data?.history || [])
    .map((item) => {
      if (
        !item.role ||
        !item.parts ||
        !Array.isArray(item.parts) ||
        item.parts.length === 0 ||
        !item.parts[0].text
      ) {
        console.warn("Invalid history item skipped:", item);
        return null;
      }
      return {
        role: item.role,
        parts: [{ text: item.parts[0].text }],
      };
    })
    .filter(Boolean);

  if (sanitizedHistory.length > 0 && sanitizedHistory[0].role !== "user") {
    console.warn(
      "First message role is not 'user', forcing role to 'user' for compliance."
    );
    sanitizedHistory[0].role = "user";
  }

  const chat = model.startChat({
    history: sanitizedHistory,
    generationConfig: {},
  });

  const endRef = useRef(null);
  const formRef = useRef(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/chats/${data._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.length ? question : undefined,
          answer,
          img: img.dbData?.filePath || undefined,
        }),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!res.ok) {
        // Try parse json error if possible, else text
        if (contentType.includes("application/json")) {
          const errorJson = await res.json();
          throw new Error(errorJson.message || "Unknown server error");
        } else {
          const errorText = await res.text();
          throw new Error(errorText || "Unknown server error");
        }
      }

      if (contentType.includes("application/json")) {
        return res.json();
      } else {
        // Unexpected non-JSON success response
        const text = await res.text();
        return { message: text };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat", data._id] }).then(() => {
        formRef.current?.reset();
        setQuestion("");
        setAnswer("");
        setImg({
          isLoading: false,
          error: "",
          dbData: {},
          aiData: {},
        });
      });
    },
    onError: (err) => {
      console.error("Mutation error:", err);
      setAnswer(`Error: ${err.message}`);
    },
  });

  const add = async (text, isInitial) => {
    if (!text || typeof text !== "string" || text.trim() === "") {
      console.warn("❗ Empty or invalid prompt. Skipping.");
      return;
    }

    if (!isInitial) setQuestion(text);
    setAnswer(""); // Clear previous answer

    try {
      const prompt = Object.entries(img.aiData).length
        ? [`${JSON.stringify(img.aiData)} ${text}`]
        : [text];

      const result = await chat.sendMessageStream(prompt);
      let accumulatedText = "";
      const chunks = [];

      // Handle the stream with proper chunking and delays
      for await (const chunk of result.stream) {
        try {
          const chunkText = chunk.text();
          chunks.push(chunkText);
          accumulatedText = chunks.join('');
          
          // Update UI with accumulated text
          setAnswer(accumulatedText);
          
          // Small delay to ensure smooth UI updates
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (streamErr) {
          console.error("Error reading stream chunk:", streamErr);
        }
      }

      // Final update with complete text
      setAnswer(accumulatedText);

      // Only mutate if we have a complete response
      if (accumulatedText) {
        await mutation.mutate();
      } else {
        throw new Error("No response received from AI");
      }
    } catch (err) {
      console.error("Error in add function:", err);
      setAnswer("Sorry, there was an error processing your request. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = e.target.text.value.trim();
    if (!text) return;
    add(text, false);
  };

  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      if (
        data?.history?.length === 1 &&
        data.history[0].parts &&
        Array.isArray(data.history[0].parts) &&
        data.history[0].parts[0] &&
        data.history[0].parts[0].text
      ) {
        add(data.history[0].parts[0].text, true);
      }
    }
    hasRun.current = true;
  }, [data]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data, question, answer, img.dbData]);

  return (
    <>
      {img.isLoading && <div>Loading...</div>}
      {img.dbData?.filePath && (
        <IKImage
          urlEndpoint={import.meta.env.VITE_IMAGE_KIT_ENDPOINT}
          path={img.dbData?.filePath}
          width="380"
          transformation={[{ width: 380 }]}
        />
      )}
      {question && <div className="message user">{question}</div>}
      {answer && (
        <div className="message">
          <Markdown>{answer}</Markdown>
        </div>
      )}
      <div className="endChat" ref={endRef}></div>
      <form className="newForm" onSubmit={handleSubmit} ref={formRef}>
        <Upload setImg={setImg} />
        <input id="file" type="file" multiple={false} hidden />
        <input type="text" name="text" placeholder="Ask anything..." />
        <button type="submit">
          <img src="/arrow.png" alt="Send" />
        </button>
      </form>
    </>
  );
};

export default NewPrompt;
