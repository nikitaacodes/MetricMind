const axios = require("axios");

const callGroqModel = async (prompt, imageBase64) => {
  const apiKey = process.env.GROQ_API_KEY;

  const payload = {
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
        ]
      }
    ]
  };

  const response = await axios.post(
    "https://api.groq.com/openai/v1/chat/completions",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      }
    }
  );

  return response.data.choices[0].message.content;
};

module.exports = callGroqModel;
