// server/utils/textToSpeech.js
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const textToSpeech = async (text) => {
  const filename = `audio_${Date.now()}.mp3`;
  const outputPath = path.join(__dirname, "../uploads/audio", filename);

  // Make sure the folder exists
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }

  // Using gTTS (Google Text-to-Speech)
  return new Promise((resolve, reject) => {
    exec(`gtts-cli "${text}" --output "${outputPath}"`, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve(outputPath);
      }
    });
  });
};

module.exports = textToSpeech;
