// server.js
const express = require("express");
const axios = require("axios");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname))); // serve index.html

// --- Hugging Face Token via .env ---
const HF_BEARER = "Bearer " + process.env.HF_TOKEN;

// --- Helper: Call Hugging Face Inference API ---
async function callHfModel(model, prompt, max_length) {
  const url = `https://api-inference.huggingface.co/models/${encodeURIComponent(model)}`;

  const payload = {
    inputs: prompt,
  };
  if (max_length) {
    payload.parameters = { max_new_tokens: Number(max_length) };
  }

  const res = await axios.post(url, payload, {
    headers: {
      Authorization: HF_BEARER,
      "Content-Type": "application/json",
    },
    timeout: 120000,
  });

  return res.data;
}

// --- API Endpoint ---
app.post("/api/generate", async (req, res) => {
  try {
    const { model = "gpt2", prompt, max_length } = req.body;
    if (!prompt) return res.status(400).send({ error: "prompt required" });

    const output = await callHfModel(model, prompt, max_length);
    res.json(output);
  } catch (err) {
    console.error("API Error:", err.response?.data || err.message);
    res
      .status(err.response?.status || 500)
      .json(err.response?.data || { error: err.message });
  }
});

// --- Server Start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Server running on http://localhost:${PORT}`)
);
