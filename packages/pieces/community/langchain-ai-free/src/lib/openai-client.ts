export async function callOpenAIChat({
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
    throw new Error("Missing OpenAI API key");
  }

  const body: any = {
    model,
    messages,
  };

  if (typeof temperature === "number") {
    body.temperature = temperature;
  }

  if (typeof maxTokens === "number") {
    body.max_tokens = maxTokens;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(
      `OpenAI Error (${response.status}): ${text}`
    );
  }

  const json = JSON.parse(text);

  return {
    output: json.choices?.[0]?.message?.content ?? "",
    usage: json.usage ?? {},
  };
}
