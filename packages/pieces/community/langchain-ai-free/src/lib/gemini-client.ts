export async function callGeminiChat({
  apiKey,
  model,
  messages,
  temperature,
  maxTokens,
}: {
  apiKey: string;
  model: string;
  messages: { role: string; content: string }[];
  temperature?: number;
  maxTokens?: number;
}) {
  if (!apiKey) {
    throw new Error("Missing Google Gemini API key");
  }

  // Gemini expects a single "contents" array of turns
  const contents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const body: any = {
    contents,
  };

  // Optional generation config
  body.generationConfig = {};
  if (typeof temperature === "number") {
    body.generationConfig.temperature = temperature;
  }
  if (typeof maxTokens === "number") {
    body.generationConfig.maxOutputTokens = maxTokens;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Gemini Error (${res.status}): ${text}`);
  }

  const json = JSON.parse(text);

  const output =
    json.candidates?.[0]?.content?.parts?.[0]?.text ??
    "";

  return {
    output,
    usage: json.usageMetadata ?? {},
  };
}
