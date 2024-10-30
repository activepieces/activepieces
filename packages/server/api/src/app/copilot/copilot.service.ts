import { logger } from '@activepieces/server-shared'
import { AskCopilotRequest, AskCopilotResponse } from '@activepieces/shared'


export const copilotService = {
    async ask({ prompt, previousContext, tools }: AskCopilotRequest): Promise<AskCopilotResponse | null> {
        logger.debug({ prompt }, '[CopilotService#ask] Prompting...')
        return null;
    },
}
