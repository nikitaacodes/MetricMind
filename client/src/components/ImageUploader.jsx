import React, { useState } from "react";
import axios from "axios";
import DescriptionDisplay from "./DescriptionDisplay";

const ImageUploader = () => {
  const [image, setImage] = useState(null);
  const [descData, setDescData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    setDescData(null); // Reset description on new image
  };

  const handleSubmit = async () => {
    if (!image) return alert("Please select an image!");

    const formData = new FormData();
    formData.append("image", image);

    try {
      setLoading(true);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL || "http://localhost:5000/api"}/vision/describe`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setDescData(res.data);

      if (res.data.audio) {
        const audio = new Audio(res.data.audio);
        audio.play().catch((err) => {
          console.error("Audio playback failed", err);
        });
      }

    } catch (err) {
      console.error(err);
      alert("Error getting description. Please check the server or image type.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        disabled={loading}
        style={{ marginBottom: "1rem" }}
      />
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Processing..." : "Describe Image"}
      </button>

      {descData && (
        <DescriptionDisplay text={descData.text} audio={descData.audio} />
      )}
    </div>
  );
};

export default ImageUploader;
