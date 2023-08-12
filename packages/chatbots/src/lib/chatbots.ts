import { ActivepiecesError, ErrorCode, isNil } from '@activepieces/shared';
import { customerServiceBot } from './bots/customer-service-bot';
import { websiteDataSource } from './datasource/website-datasource';
import { llm } from './framework/llm';

const chatbots = [customerServiceBot];
const datasources = [websiteDataSource];

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
  type,
  input,
  settings
}: {
  type: string;
  input: string;
  settings: Record<string, unknown>;
}) => {
  const bot = chatbots.find((b) => b.name === type);
  if (!bot) {
    throw new Error(`Bot ${type} not found`);
  }
  return bot.run({
    input,
    llm: llm,
    // TODO FIX
    embeddings: {} as any,
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
