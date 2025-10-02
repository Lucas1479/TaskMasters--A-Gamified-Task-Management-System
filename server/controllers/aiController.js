import asyncHandler from "express-async-handler";

// Minimal, non-intrusive AI suggestion endpoint.
// Calls OpenAI-compatible API or Gemini depending on env; otherwise uses a simple fallback parser.

const SYSTEM_PROMPT = `You are an assistant that converts a natural language goal into task suggestions for a productivity app. 
Return ONLY a JSON object with a 'tasks' array. Each task has: 
  - title (string, required)
  - description (string, optional)
  - type ("short" | "long")
  - category (string, optional)
  - experienceReward (number, default 30)
  - goldReward (number, default 15)
  - subTasks (array for long tasks; each subtask has title and dueDate ISO string)
  - dueDate (ISO string; for short tasks if provided)
No extra commentary.`;

const parseJsonSafely = (text) => {
  try {
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
};

const buildOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  if (!apiKey) return null;
  return { apiKey, baseURL };
};

const buildGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  const baseURL = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com";
  if (!apiKey) return null;
  return { apiKey, baseURL };
};

export const suggestTasks = asyncHandler(async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ message: "Missing prompt" });
  }

  const provider = (process.env.AI_PROVIDER || '').toLowerCase();

  // Try OpenAI-compatible API first (when provider unspecified or set to openai)
  const client = provider === '' || provider === 'openai' ? buildOpenAIClient() : null;
  if (client) {
    try {
      const resp = await fetch(`${client.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${client.apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        console.error("AI suggestTasks error:", text);
        throw new Error(`Upstream error ${resp.status}`);
      }
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || "";
      const parsed = parseJsonSafely(content);
      if (!parsed?.tasks || !Array.isArray(parsed.tasks)) {
        return res.status(200).json({ tasks: [] });
      }
      return res.json({ tasks: parsed.tasks });
    } catch (err) {
      console.warn("OpenAI error, trying Gemini or heuristic:", err?.message);
    }
  }

  // Then try Gemini (when provider unspecified or set to gemini)
  const gem = provider === '' || provider === 'gemini' ? buildGeminiClient() : null;
  if (gem) {
    try {
      const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
      const url = `${gem.baseURL}/v1beta/models/${model}:generateContent?key=${gem.apiKey}`;
      const body = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          { role: "user", parts: [{ text: prompt }] }
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.2
        }
      };
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        const text = await resp.text();
        console.error("Gemini suggestTasks error:", text);
        throw new Error(`Upstream error ${resp.status}`);
      }
      const data = await resp.json();
      const contentText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const parsed = parseJsonSafely(contentText);
      if (!parsed?.tasks || !Array.isArray(parsed.tasks)) {
        return res.status(200).json({ tasks: [] });
      }
      return res.json({ tasks: parsed.tasks });
    } catch (err) {
      console.warn("Gemini error, falling back to heuristic:", err?.message);
      // fall through to heuristic
    }
  }

  // Heuristic fallback: split lines into short tasks
  const lines = prompt
    .split(/\r?\n/) 
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const tasks = lines.slice(0, 5).map((line) => ({
    title: line.slice(0, 80),
    description: line,
    type: "short",
    category: "AI",
    experienceReward: 30,
    goldReward: 15,
  }));
  return res.json({ tasks });
});

export default { suggestTasks };


