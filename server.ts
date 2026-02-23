import express from "express";
import { createServer as createViteServer } from "vite";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

  // Mock data for voices if no API key
  const MOCK_VOICES = [
    { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
    { voice_id: "AZnzlk1XhkDUD0M8zjUM", name: "Adam" },
    { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
    { voice_id: "MF3mGyEYCl7XYW7ICZ8u", name: "Antoni" },
    { voice_id: "VR6AewyH7oxUXjzD49uU", name: "Arnold" },
  ];

  const MOCK_MODELS = [
    { model_id: "eleven_multilingual_v2", name: "Eleven Multilingual v2" },
    { model_id: "eleven_turbo_v2", name: "Eleven Turbo v2" },
    { model_id: "eleven_v3_alpha", name: "Eleven v3 Alpha" },
  ];

  // API Routes
  app.get("/api/voices", async (req, res) => {
    const customKey = req.headers["x-elevenlabs-key"] as string;
    const apiKey = customKey || ELEVENLABS_API_KEY;

    if (!apiKey) {
      return res.json({ voices: MOCK_VOICES });
    }
    try {
      const response = await axios.get("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": apiKey },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Error fetching voices:", error.message);
      res.json({ voices: MOCK_VOICES });
    }
  });

  app.get("/api/models", async (req, res) => {
    const customKey = req.headers["x-elevenlabs-key"] as string;
    const apiKey = customKey || ELEVENLABS_API_KEY;

    if (!apiKey) {
      return res.json(MOCK_MODELS);
    }
    try {
      const response = await axios.get("https://api.elevenlabs.io/v1/models", {
        headers: { "xi-api-key": apiKey },
      });
      res.json(response.data);
    } catch (error: any) {
      console.error("Error fetching models:", error.message);
      res.json(MOCK_MODELS);
    }
  });

  app.post("/api/tts", async (req, res) => {
    const { text, voiceId, modelId, settings } = req.body;
    const customKey = req.headers["x-elevenlabs-key"] as string;
    const apiKey = customKey || ELEVENLABS_API_KEY;

    if (!text || !voiceId) {
      return res.status(400).json({ error: "Missing text or voiceId" });
    }

    if (!apiKey) {
      // Simulate delay for mock
      await new Promise((resolve) => setTimeout(resolve, 1500));
      try {
        // Fetch a public sample audio to serve as mock
        const mockAudio = await axios.get("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", {
          responseType: 'arraybuffer',
          timeout: 5000
        });
        res.set("Content-Type", "audio/mpeg");
        return res.send(mockAudio.data);
      } catch (error) {
        console.error("Mock fetch failed, using local error:", error);
        return res.status(500).json({ error: "Không thể tải âm thanh mẫu. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau." });
      }
    }

    try {
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          text,
          model_id: modelId || "eleven_multilingual_v2",
          voice_settings: settings || {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true,
          },
        },
        {
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
        }
      );

      res.set("Content-Type", "audio/mpeg");
      res.send(response.data);
    } catch (error: any) {
      let errorMessage = "Failed to generate speech";
      
      if (error.response?.data instanceof Buffer || error.response?.data instanceof ArrayBuffer) {
        try {
          const decoder = new TextDecoder();
          const errorJson = JSON.parse(decoder.decode(error.response.data));
          errorMessage = errorJson.detail?.message || errorJson.error?.message || errorMessage;
        } catch (e) {
          errorMessage = error.message;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else {
        errorMessage = error.message;
      }

      console.error("TTS Error:", errorMessage);
      res.status(error.response?.status || 500).json({ error: errorMessage });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
