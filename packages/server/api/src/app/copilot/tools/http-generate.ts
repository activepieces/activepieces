import { AskCopilotRequest } from "@activepieces/shared";
import OpenAI from "openai";

const perplexityApiKey = '';

const openai = new OpenAI({
  apiKey: perplexityApiKey,
  baseURL: 'https://api.perplexity.ai',
});

export const httpGeneratorTool = {
  async generateHttpRequest(
    request: AskCopilotRequest
  ): Promise<string | null> {
    const prompt = `Generate a JSON object for an API call based on this description: "${request.prompt}".`;

    const response = await openai.chat.completions.create({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: `You are an API expert. Respond only in JSON format with no extract text for API calls. 
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

}