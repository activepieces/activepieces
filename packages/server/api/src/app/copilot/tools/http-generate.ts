import { AskCopilotRequest } from '@activepieces/shared'
import OpenAI from 'openai'
import { processHttpRequest } from './http-agent'

const perplexityApiKey =
  '------ API KEY HERE ------'

const openai = new OpenAI({
    apiKey: perplexityApiKey,
    baseURL: 'https://api.perplexity.ai',
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