const gTTS = require("gtts");
const fs = require("fs");
const path = require("path");

const textToSpeech = async (text) => {
  const filePath = path.join(__dirname, "..", "tts", `speech_${Date.now()}.mp3`);
  return new Promise((resolve, reject) => {
    const gtts = new gTTS(text);
    gtts.save(filePath, (err) => {
      if (err) reject(err);
      else resolve(`/tts/${path.basename(filePath)}`);
    });
  });
};

module.exports = { textToSpeech };
