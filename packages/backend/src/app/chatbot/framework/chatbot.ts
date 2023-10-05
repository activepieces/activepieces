
import { APChatMessage } from '@activepieces/shared'
import { ApEmbeddings } from '../embedings'
import { APLLM } from './llm'


type ChatbotAskContext = {
    settings: {
        prompt: string
    }
    input: string
    llm: APLLM
    embeddings: ApEmbeddings
    history: APChatMessage[]
}

class IChatbot {
    constructor(
        public readonly name: string,
        public readonly run: (ctx: ChatbotAskContext) => Promise<string>,
    ) { }
}

export const createChatbot = (request: {
    name: string
    run: (ctx: ChatbotAskContext) => Promise<string>
}) => {
    return new IChatbot(
        request.name,
        request.run,
    )
}

