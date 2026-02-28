import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

interface Voice {
  voice_id: string;
  name: string;
  category?: string;
  description?: string;
  labels?: Record<string, string>;
}

// Mock data for voices if no API key
const MOCK_VOICES: Voice[] = [
  { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", labels: { gender: "female", accent: "american", description: "Truyền cảm" } },
  { voice_id: "pNInz6obpgDQGcFmaJgB", name: "Adam", labels: { gender: "male", accent: "american", description: "Trầm ấm" } },
  { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", labels: { gender: "female", accent: "american", description: "Trẻ trung" } },
  { voice_id: "ErXw7Sg8S8nC9S1f9S8n", name: "Antoni", labels: { gender: "male", accent: "american", description: "Chững chạc" } },
  { voice_id: "VR6AewyH7oxUXjzD49uU", name: "Arnold", labels: { gender: "male", accent: "american", description: "Mạnh mẽ" } },
  { voice_id: "TxGEqnHW47M3Ko8QbtCc", name: "Josh", labels: { gender: "male", accent: "american", description: "Năng động" } },
  { voice_id: "MF3mGyEYCl7XYW7ICZ8u", name: "Elli", labels: { gender: "female", accent: "american", description: "Ngọt ngào" } },
  { voice_id: "AZnzlk1XhkDUD0M8zjUM", name: "Domi", labels: { gender: "female", accent: "american", description: "Chuyên nghiệp" } },
  { voice_id: "ThT52p0601", name: "Dorothy", labels: { gender: "female", accent: "american", description: "Kể chuyện" } },
  { voice_id: "Lcf7m35p0601", name: "Emily", labels: { gender: "female", accent: "american", description: "Nhẹ nhàng" } },
  { voice_id: "GBv7mTt0atIp3Y8iH6PL", name: "Thomas", labels: { gender: "male", accent: "american", description: "Tin tức" } },
  { voice_id: "ZQe5f7m35p0601", name: "James", labels: { gender: "male", accent: "american", description: "Thuyết minh" } },
  { voice_id: "onw5f7m35p0601", name: "Daniel", labels: { gender: "male", accent: "american", description: "Quảng cáo" } },
  { voice_id: "pMs7m35p0601", name: "Serena", labels: { gender: "female", accent: "american", description: "Êm ái" } },
  { voice_id: "z9f7m35p0601", name: "Glinda", labels: { gender: "female", accent: "american", description: "Phù thủy" } },
  { voice_id: "yoZf7m35p0601", name: "Sam", labels: { gender: "male", accent: "american", description: "Thân thiện" } },
  { voice_id: "IKne3meS2pL762p0601", name: "Charlie", labels: { gender: "male", accent: "american", description: "Tinh nghịch" } },
  { voice_id: "jBf7m35p0601", name: "Gigi", labels: { gender: "female", accent: "american", description: "Hoạt hình" } },
  { voice_id: "jsf7m35p0601", name: "Freya", labels: { gender: "female", accent: "american", description: "Bí ẩn" } },
  { voice_id: "oP7m35p0601", name: "Grace", labels: { gender: "female", accent: "american", description: "Sang trọng" } },
  { voice_id: "piTKp0601", name: "Nicole", labels: { gender: "female", accent: "american", description: "Thì thầm" } },
  { voice_id: "t0f7m35p0601", name: "Jessie", labels: { gender: "female", accent: "american", description: "Cá tính" } },
  { voice_id: "wVf7m35p0601", name: "Ryan", labels: { gender: "male", accent: "american", description: "Thể thao" } },
  { voice_id: "zE5f7m35p0601", name: "Giovanni", labels: { gender: "male", accent: "american", description: "Ngoại quốc" } },
  { voice_id: "zrHi7m35p0601", name: "Mimi", labels: { gender: "female", accent: "american", description: "Dễ thương" } },
  { voice_id: "N2lVSf6p0601", name: "Callum", labels: { gender: "male", accent: "american", description: "Khàn đặc" } },
  { voice_id: "ODq5zWAf6p0601", name: "Patrick", labels: { gender: "male", accent: "american", description: "Hùng hồn" } },
  { voice_id: "SOYf8p0601", name: "Harry", labels: { gender: "male", accent: "american", description: "Trẻ em" } },
  { voice_id: "TX3LPp0601", name: "Liam", labels: { gender: "male", accent: "american", description: "Ấm áp" } },
  { voice_id: "XB0f7m35p0601", name: "Charlotte", labels: { gender: "female", accent: "american", description: "Kiêu kỳ" } },
  { voice_id: "Xb7m35p0601", name: "Alice", labels: { gender: "female", accent: "american", description: "Hiền hậu" } },
  { voice_id: "Zlb1m35p0601", name: "Joseph", labels: { gender: "male", accent: "american", description: "Nghiêm túc" } },
  { voice_id: "bVp7m35p0601", name: "Jeremy", labels: { gender: "male", accent: "american", description: "Vui vẻ" } },
  { voice_id: "flqf7m35p0601", name: "Michael", labels: { gender: "male", accent: "american", description: "Lịch lãm" } },
  { voice_id: "g5f7m35p0601", name: "Ethan", labels: { gender: "male", accent: "american", description: "Trầm mặc" } },
  { voice_id: "vi_vn_male_1", name: "Minh (Nam - Miền Bắc)", labels: { gender: "male", accent: "vietnamese", description: "Mạnh mẽ" } },
  { voice_id: "vi_vn_female_1", name: "Linh (Nữ - Miền Bắc)", labels: { gender: "female", accent: "vietnamese", description: "Dịu dàng" } },
  { voice_id: "vi_vn_male_2", name: "Hùng (Nam - Miền Nam)", labels: { gender: "male", accent: "vietnamese", description: "Hào sảng" } },
  { voice_id: "vi_vn_female_2", name: "Mai (Nữ - Miền Nam)", labels: { gender: "female", accent: "vietnamese", description: "Ngọt ngào" } },
];

const MOCK_MODELS = [
  { model_id: "eleven_multilingual_v2", name: "Multilingual v2 (Đa ngôn ngữ - Tốt nhất)" },
  { model_id: "eleven_turbo_v2", name: "Turbo v2 (Tốc độ cao)" },
  { model_id: "eleven_turbo_v2_5", name: "Turbo v2.5 (Mới nhất)" },
  { model_id: "eleven_flash_v1", name: "Flash v1 (Siêu nhanh)" },
  { model_id: "eleven_v3_alpha", name: "v3 Alpha (Thử nghiệm)" },
];

const isKeyValid = (key: string | undefined): boolean => {
  if (!key) return false;
  // ElevenLabs keys are typically 32 chars, but let's be safe with > 20
  return key.length > 20 && !key.includes("YOUR_API_KEY");
};

// API Routes
app.get("/api/voices", async (req, res) => {
  const customKey = req.headers["x-elevenlabs-key"] as string;
  const apiKey = customKey || ELEVENLABS_API_KEY;

  if (!isKeyValid(apiKey)) {
    return res.json({ voices: MOCK_VOICES, is_mock: true });
  }
  try {
    const response = await axios.get("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
      timeout: 5000,
    });
    res.json({ ...response.data, is_mock: false });
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn("Invalid API Key provided, falling back to mock voices.");
    } else {
      console.error("Error fetching voices:", error.message);
    }
    res.json({ voices: MOCK_VOICES, is_mock: true });
  }
});

app.get("/api/models", async (req, res) => {
  const customKey = req.headers["x-elevenlabs-key"] as string;
  const apiKey = customKey || ELEVENLABS_API_KEY;

  if (!isKeyValid(apiKey)) {
    return res.json(MOCK_MODELS.map(m => ({ ...m, is_mock: true })));
  }
  try {
    const response = await axios.get("https://api.elevenlabs.io/v1/models", {
      headers: { "xi-api-key": apiKey },
      timeout: 5000,
    });
    res.json(response.data);
  } catch (error: any) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.warn("Invalid API Key provided, falling back to mock models.");
    } else {
      console.error("Error fetching models:", error.message);
    }
    res.json(MOCK_MODELS);
  }
});

const serveMockAudio = async (res: any) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  try {
    const mockAudio = await axios.get("https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", {
      responseType: 'arraybuffer',
      timeout: 5000
    });
    res.set("Content-Type", "audio/mpeg");
    return res.send(mockAudio.data);
  } catch (error) {
    console.error("Mock fetch failed:", error);
    return res.status(500).json({ error: "Không thể tải âm thanh mẫu." });
  }
};

app.post("/api/tts", async (req, res) => {
  const { text, voiceId, modelId, settings } = req.body;
  const customKey = req.headers["x-elevenlabs-key"] as string;
  const apiKey = customKey || ELEVENLABS_API_KEY;

  if (!text || !voiceId) {
    return res.status(400).json({ error: "Missing text or voiceId" });
  }

  if (!apiKey || voiceId.startsWith("vi_vn_")) {
    return serveMockAudio(res);
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
    // Fallback to mock if voice not found (404)
    if (error.response?.status === 404) {
      console.warn(`Voice ${voiceId} not found, falling back to mock audio.`);
      return serveMockAudio(res);
    }

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
    res.status(error.response?.status || 500).json({ error: errorMessage });
  }
});

// Setup serving
const startApp = async () => {
  if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== '1') {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not Found' });
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (process.env.VERCEL !== '1') {
    const PORT = 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
};

startApp();

export default app;
