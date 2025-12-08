export async function callAnthropicChat({
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
    throw new Error("Missing Anthropic API key");
  }

  const body: any = {
    model,
    max_tokens: maxTokens ?? 1024,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  };

  if (typeof temperature === "number") {
    body.temperature = temperature;
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Anthropic Error (${res.status}): ${text}`);
  }

  const json = JSON.parse(text);

  const output =
    json.content?.[0]?.text ??
    json.content?.[0]?.content ??
    "";

  return {
    output,
    usage: json.usage ?? {},
  };
}
