import {
  ShortTextProperty,
  StaticPropsValue
} from '@activepieces/pieces-framework';
import { APLLM } from './llm';
import { ApEmbeddings } from './embeddings';

interface ChatbotPropertyMap {
  [name: string]: ShortTextProperty<boolean>;
}

type ChatbotAnswerContext<props extends ChatbotPropertyMap> = {
  settings: StaticPropsValue<props>;
  input: string;
  llm: APLLM;
  embeddings: ApEmbeddings
};

class IChatbot<props extends ChatbotPropertyMap> {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
    public readonly description: string,
    public readonly run: (ctx: ChatbotAnswerContext<props>) => Promise<string>,
    public readonly settings: props
  ) {}
}

export const createChatbot = <props extends ChatbotPropertyMap>(request: {
  name: string;
  displayName: string;
  description: string;
  run: (ctx: ChatbotAnswerContext<props>) => Promise<string>;
  settings: props;
}) => {
  return new IChatbot(
    request.name,
    request.displayName,
    request.description,
    request.run,
    request.settings
  );
};
