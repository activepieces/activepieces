/**
 * Advanced routing logic for PRO users.
 * Chooses the best provider+model depending on the agent goal and input.
 */

export interface RoutedModel {
  provider: "openai" | "anthropic" | "gemini";
  model: string;
  llm: (args: { prompt: string; temperature: number }) => Promise<string>;
}

const env = (process.env as any); // <-- soluzione TOTALMENTE compatibile con Nx

export function advancedRoute(input: string, goal: string): RoutedModel {
  const goalLower = goal.toLowerCase();
  const needsReasoning =
    goalLower.includes("research") ||
    goalLower.includes("analysis") ||
    goalLower.includes("deep thinking");

  // Claude for reasoning
  if (needsReasoning) {
    return {
      provider: "anthropic",
      model: "claude-3-5-sonnet-20240620",
      llm: async ({ prompt, temperature }) => {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": env["ANTHROPIC_API_KEY"],
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20240620",
            max_tokens: 2048,
            temperature,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        const json = await res.json();
        return (
          json.content?.[0]?.text ||
          json.content?.[0]?.content ||
          ""
        );
      },
    };
  }

  // Default OpenAI
  return {
    provider: "openai",
    model: "gpt-4o-mini",
    llm: async ({ prompt, temperature }) => {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env["OPENAI_API_KEY"]}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature,
        }),
      });

      const json = await res.json();
      return json.choices?.[0]?.message?.content ?? "";
    },
  };
}
