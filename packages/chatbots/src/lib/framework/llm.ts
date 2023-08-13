import { OpenAI } from 'langchain/llms/openai';

export interface APLLM {
  chat: ({ input, temperature, maxTokens }: AskChat) => Promise<string>;
}

export const llm = {
  async chat({ input, temperature, maxTokens }: AskChat) {
    const model = new OpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: temperature || 0.7,
      maxTokens: maxTokens
    });
    const response = await model.call(input);
    return response;
  }
};

type AskChat = {
  input: string;
  history: {
    text: string;
    role: 'bot' | 'user';
  }[],
  temperature?: number;
  maxTokens?: number;
};
