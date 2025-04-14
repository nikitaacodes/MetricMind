// DescriptionDisplay.jsx

import React from "react";

const DescriptionDisplay = ({ text, audio }) => {
  return (
    <div style={{ marginTop: "30px", textAlign: "center", padding: "20px", border: "1px solid #ddd", borderRadius: "12px", background: "#f9f9f9" }}>
      <h2>📝 Image Description</h2>
      <p style={{ fontSize: "1.2rem", marginTop: "10px", color: "#444" }}>
        {text || "No description available."}
      </p>

      {audio && (
        <>
          <h3 style={{ marginTop: "20px" }}>🔊 Listen to the description:</h3>
          <audio controls style={{ marginTop: "10px" }}>
            <source src={audio} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
        </>
      )}
    </div>
  );
};

export default DescriptionDisplay;
