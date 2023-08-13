import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared';
import { customBot } from './bots/custom-bot';
import { llm } from './framework/llm';
import { memoryEmbedding } from './framework/embeddings';
import { pdfDataSource } from './datasource/pdf-datasource';

const chatbots = [customBot];
const datasources = [pdfDataSource];

export function getChatBotType({ type }: { type: string }) {
  const chatbot = chatbots.find((b) => b.name === type);
  if (isNil(chatbot)) {
    throw new ActivepiecesError({
      code: ErrorCode.ENTITY_NOT_FOUND,
      params: {
        message: `Chatbot with type ${type} not found`
      }
    });
  }
  return chatbot;
}

export const runBot = async ({
  botId,
  type,
  input,
  settings
}: {
  botId: string;
  type: string;
  input: string;
  settings: {
    prompt: string;
  };
}) => {
  const bot = chatbots.find((b) => b.name === type);
  if (!bot) {
    throw new Error(`Bot ${type} not found`);
  }
  return bot.run({
    input,
    llm: llm,
    embeddings: memoryEmbedding(botId),
    settings: settings
  });
};

export const syncDatasource = async ({
  sourceName,
  propsValue,
  auth
}: {
  sourceName: string;
  propsValue: any;
  auth: any;
}) => {
  const datasource = datasources.find((b) => b.name === sourceName);
  if (!datasource) {
    throw new Error(`Datasource ${sourceName} not found`);
  }
  return datasource.sync({
    auth: auth,
    propsValue: propsValue
  });
};
