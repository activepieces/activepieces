import OpenAI from "openai";

interface PerplexityResponse {
    body?: any;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers: Record<string, string>;
    queryParams?: Record<string, string>;
    url: string;
}

const perplexityApiKey = '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';

const openai = new OpenAI({
    apiKey: perplexityApiKey,
    baseURL: 'https://api.perplexity.ai"',
});

export async function generateHttpRequest(
    apiDescription: string
): Promise<string | null> {
    const prompt = `Generate a JSON object for an API call based on this description: "${apiDescription}".`;

    const response = await openai.chat.completions.create({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
            {
                role: 'system',
                content: `You are an API expert. Respond only with valid JSON for API calls. 
          The response should include:
          - method (GET/POST/PUT/DELETE/PATCH)
          - url (full endpoint URL)
          - headers (as an object)
          - body (if applicable)
          - queryParams (if applicable)
          Format as valid JSON.
          Example 1:
          {
            "method": "GET",
            "url": "https://api.example.com/data",
            "headers": {
              "Authorization": "Bearer YOUR_API_KEY",
              "Content-Type": "application/json"
            },
            "queryParams": {
              "param1": "value1",
              "param2": "value2"
            }
          }
          Example 2:
          {
            "method": "POST",
            "url": "https://api.example.com/data",
            "headers": {
              "Authorization": "Bearer YOUR_API_KEY",
              "Content-Type": "application/json"
            },
            "body": {
              "key": "value"
            }
          }`
            },
            {
                role: 'user',
                content: prompt
            }
        ],
    });

    return response.choices[0].message.content;
}

