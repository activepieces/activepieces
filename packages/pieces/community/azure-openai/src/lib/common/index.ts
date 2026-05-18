import { encoding_for_model } from 'tiktoken';

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
  messages: string[],
  model: string
) => {
  let tokenLength = 0;
  await Promise.all(
    messages.map((message: string) => {
      return new Promise((resolve) => {
        tokenLength += calculateTokensFromString(message, model);
        resolve(tokenLength);
      });
    })
  );

  return tokenLength;
};

export const reduceContextSize = async (
  messages: string[],
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
    default:
      return 2048;
  }
};