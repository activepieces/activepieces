import { AskCopilotRequest } from '@activepieces/shared'
import OpenAI from 'openai'
import { processHttpRequest } from './http-agent'
import { system } from '@activepieces/server-shared'
import { AppSystemProp } from '@activepieces/server-shared'



const openai = new OpenAI({
    apiKey: system.get(AppSystemProp.PERPLEXITY_API_KEY),
    baseURL: system.get(AppSystemProp.PERPLEXITY_BASE_URL),
})

export const httpGeneratorTool = {
    async generateHttpRequest(
        request: AskCopilotRequest,
    ): Promise<Record<string, unknown> | null> {
        try {
            const prompt = `Generate a JSON object for an API call based on this description: "${request.prompt}".`

            const response = await openai.chat.completions.create({
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