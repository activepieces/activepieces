import { AskCopilotRequest, isNil } from '@activepieces/shared'
import OpenAI from 'openai'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-prop'
import { processHttpRequest } from './http-agent'

let openai: OpenAI | null = null
const getOpenai = ()=>{
    if (isNil(openai)) {
        openai = new OpenAI({
            apiKey: system.get(AppSystemProp.PERPLEXITY_API_KEY),
            baseURL: system.get(AppSystemProp.PERPLEXITY_BASE_URL),
        })
    }
    return openai
}

export const httpGeneratorTool = {
    async generateHttpRequest(
        request: AskCopilotRequest,
    ): Promise<Record<string, unknown> | null> {
        try {
            const prompt = `Generate a JSON object for an API call based on this description: "${request.prompt}".`

            const response = await getOpenai().chat.completions.create({
                model: 'llama-3.1-sonar-large-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: 'You are an API expert. Respond only in JSON format with no extract text for API calls.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
            })

            const perplexityResponse = response.choices[0].message.content
            if (!perplexityResponse) {
                return null
            }

            return await processHttpRequest(perplexityResponse)
        }
        catch (error) {
            return null
        }
    },
}