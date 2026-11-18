import { aiProviderUtils } from '@activepieces/pieces-framework';
import { encoding_for_model } from 'tiktoken';

export const baseUrl = 'https://api.openai.com/v1';

export const Languages = [
  { value: 'af', label: 'Afrikaans' },
  { value: 'ar', label: 'Arabic' },
  { value: 'hy', label: 'Armenian' },
  { value: 'az', label: 'Azerbaijani' },
  { value: 'be', label: 'Belarusian' },
  { value: 'bs', label: 'Bosnian' },
  { value: 'bg', label: 'Bulgarian' },
  { value: 'ca', label: 'Catalan' },
  { value: 'zh', label: 'Chinese (Simplified)' },
  { value: 'hr', label: 'Croatian' },
  { value: 'cs', label: 'Czech' },
  { value: 'da', label: 'Danish' },
  { value: 'nl', label: 'Dutch' },
  { value: 'en', label: 'English' },
  { value: 'et', label: 'Estonian' },
  { value: 'fi', label: 'Finnish' },
  { value: 'fr', label: 'French' },
  { value: 'gl', label: 'Galician' },
  { value: 'de', label: 'German' },
  { value: 'el', label: 'Greek' },
  { value: 'he', label: 'Hebrew' },
  { value: 'hi', label: 'Hindi' },
  { value: 'hu', label: 'Hungarian' },
  { value: 'is', label: 'Icelandic' },
  { value: 'id', label: 'Indonesian' },
  { value: 'it', label: 'Italian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'kn', label: 'Kannada' },
  { value: 'kk', label: 'Kazakh' },
  { value: 'ko', label: 'Korean' },
  { value: 'lv', label: 'Latvian' },
  { value: 'lt', label: 'Lithuanian' },
  { value: 'mk', label: 'Macedonian' },
  { value: 'ms', label: 'Malay' },
  { value: 'mi', label: 'Maori' },
  { value: 'mr', label: 'Marathi' },
  { value: 'ne', label: 'Nepali' },
  { value: 'no', label: 'Norwegian' },
  { value: 'fa', label: 'Persian' },
  { value: 'pl', label: 'Polish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ro', label: 'Romanian' },
  { value: 'ru', label: 'Russian' },
  { value: 'sr', label: 'Serbian' },
  { value: 'sk', label: 'Slovak' },
  { value: 'sl', label: 'Slovenian' },
  { value: 'es', label: 'Spanish' },
  { value: 'sw', label: 'Swahili' },
  { value: 'sv', label: 'Swedish' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'ta', label: 'Tamil' },
  { value: 'th', label: 'Thai' },
  { value: 'tr', label: 'Turkish' },
  { value: 'uk', label: 'Ukrainian' },
  { value: 'ur', label: 'Urdu' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'cy', label: 'Welsh' },
];

export const billingIssueMessage = `Error Occurred: 429 \n
1. Ensure that billing is enabled on your OpenAI platform. \n
2. Generate a new API key. \n
3. Attempt the process again. \n
For guidance, visit: https://beta.openai.com/account/billing`;

export const unauthorizedMessage = `Error Occurred: 401 \n
Ensure that your API key is valid. \n`;

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const streamToBuffer = (stream: any) => {
  const chunks: any[] = [];
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: any) => chunks.push(Buffer.from(chunk)));
    stream.on('error', (err: any) => reject(err));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
};

export const calculateTokensFromString = (string: string, model: string) => {
  try {
    const encoder = encoding_for_model(model as any);
    const tokens = encoder.encode(string);
    encoder.free();

    return tokens.length;
  } catch (e) {
    // Model not supported by tiktoken, every 4 chars is a token
    return Math.round(string.length / 4);
  }
};

export const calculateMessagesTokenSize = async (
  messages: any[],
  model: string
) => {
  let tokenLength = 0;
  await Promise.all(
    messages.map((message: any) => {
      return new Promise((resolve) => {
        tokenLength += calculateTokensFromString(message.content, model);
        resolve(tokenLength);
      });
    })
  );

  return tokenLength;
};

export const reduceContextSize = async (
  messages: any[],
  model: string,
  maxTokens: number
) => {
  // TODO: Summarize context instead of cutoff
  const cutoffSize = Math.round(messages.length * 0.1);
  const cutoffMessages = messages.splice(cutoffSize, messages.length - 1);

  if (
    (await calculateMessagesTokenSize(cutoffMessages, model)) >
    maxTokens / 1.5
  ) {
    reduceContextSize(cutoffMessages, model, maxTokens);
  }

  return cutoffMessages;
};

export const exceedsHistoryLimit = (
  tokenLength: number,
  model: string,
  maxTokens: number
) => {
  if (
    tokenLength >= tokenLimit / 1.1 ||
    tokenLength >= (modelTokenLimit(model) - maxTokens) / 1.1
  ) {
    return true;
  }

  return false;
};

export const tokenLimit = 32000;

export const modelTokenLimit = (model: string) => {
  switch (model) {
    case 'gpt-4-1106-preview':
      return 128000;
    case 'gpt-4-vision-preview':
      return 128000;
    case 'gpt-4':
      return 8192;
    case 'gpt-4-32k':
      return 32768;
    case 'gpt-4-0613':
      return 8192;
    case 'gpt-4-32k-0613':
      return 32768;
    case 'gpt-4-0314':
      return 8192;
    case 'gpt-4-32k-0314':
      return 32768;
    case 'gpt-3.5-turbo-1106':
      return 16385;
    case 'gpt-3.5-turbo':
      return 4096;
    case 'gpt-3.5-turbo-16k':
      return 16385;
    case 'gpt-3.5-turbo-instruct':
      return 4096;
    case 'gpt-3.5-turbo-0613':
      return 4096;
    case 'gpt-3.5-turbo-16k-0613':
      return 16385;
    case 'gpt-3.5-turbo-0301':
      return 4096;
    case 'text-davinci-003':
      return 4096;
    case 'text-davinci-002':
      return 4096;
    case 'code-davinci-002':
      return 8001;
    case 'text-moderation-latest':
      return 32768;
    case 'text-moderation-stable':
      return 32768;
    case 'gpt-5':
      return 400000;
    case 'gpt-5-chat-latest':
      return 400000;
    case 'gpt-5-mini':
      return 400000;
    case 'gpt-5-nano':
      return 400000;
    default:
      return 2048;
  }
};

export const isLLM = (modelId: string): boolean =>
  aiProviderUtils.isChatModelId({ modelId });
