export async function callLlm(req: any) {
  const { provider, model, userPrompt, systemPrompt, context } = req;

  return {
    output:
      "FAKE LLM RESPONSE\n\n" +
      JSON.stringify(
        {
          provider,
          model,
          systemPrompt,
          userPrompt,
          context,
        },
        null,
        2
      ),
    usage: {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    },
  };
}
