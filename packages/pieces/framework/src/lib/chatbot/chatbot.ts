import { ShortTextProperty, StaticPropsValue } from '../property';

export interface ChatbotPropertyMap {
	[name: string]: ShortTextProperty<boolean>
}

export interface ChatbotSyncContext<props extends ChatbotPropertyMap> {
  settings: StaticPropsValue<props>;
}

export type ChatbotAnswerContext<props extends ChatbotPropertyMap> =
  ChatbotSyncContext<props> & {
    input: string;
  };

export class IChatbot<props extends ChatbotPropertyMap> {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly run: (
      ctx: ChatbotSyncContext<props>
    ) => Promise<unknown | void>,
    public readonly settings: props
  ) {}
}

export const createChatbot = <props extends ChatbotPropertyMap>(
  name: string,
  displayName: string,
  description: string,
  run: (ctx: ChatbotSyncContext<props>) => Promise<unknown | void>,
  settings: props
) => {
  return new IChatbot(name, displayName, description, run, settings);
};
