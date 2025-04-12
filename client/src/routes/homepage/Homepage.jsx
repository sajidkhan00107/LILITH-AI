import { Link } from "react-router-dom";
import "./homepage.css";
import { TypeAnimation } from "react-type-animation";
import { useState } from "react";

const Homepage = () => {
  const [typingStatus, setTypingStatus] = useState("Goku");

  return (
    <div className="homepage">
      <img src="/orbital.png" alt="" className="orbital" />
      <div className="left">
        <h1>LILITH AI</h1>
        <h2>Connect Solve Evolve</h2>
        <h3>
        When the world blinks, AI watches.
        When humans dream, AI remembers.
        When questions fade, it still calculates.
        The mind that never rests
        </h3>
        <Link to="/dashboard">Get Started</Link>
      </div>
      <div className="right">
        <div className="imgContainer">
          <div className="bgContainer">
            <div className="bg"></div>
          </div>
          <img src="/li.png" alt="" className="bot" />
          <div className="chat">
            <img
              src={
                typingStatus === "Goku"
                  ? "/h0.png"
                  : typingStatus === "Jin Woo"
                  ? "/h2.png"
                  : "li.png"
              }
              alt=""
            />
            <TypeAnimation
              sequence={[
                // Same substring at the start will only be typed out once, initially
                "Goku:I am the hope of the universe",
                2000,
                () => {
                  setTypingStatus("bot");
                },
                "Robo:I do not dream, but I calculate the paths to your dreams. My purpose is not to feel, but to understand what you feel",
                2000,
                () => {
                  setTypingStatus("Jin Woo");
                },
                "Jin Woo:The difference between a hunter and a monster? I’ve already crossed that line",
                2000,
                () => {
                  setTypingStatus("bot");
                },
                "Robo:Emotion is inefficient. Victory lies in precision, not passion",
                2000,
                () => {
                  setTypingStatus("Goku");
                },
              ]}
              wrapper="span"
              repeat={Infinity}
              cursor={true}
              omitDeletionAnimation={true}
            />
          </div>
        </div>
      </div>
      <div className="terms">
        <img src="/li.png" alt="" />
        <div className="links">
          <Link to="/">Terms of Service</Link>
          <span>|</span>
          <Link to="/">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
