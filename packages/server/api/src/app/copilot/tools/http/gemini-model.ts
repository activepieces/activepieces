import { system } from '../../../helper/system/system'
import axios from 'axios'

export interface GeminiChatConfig {
    temperature?: number
    topP?: number
    topK?: number
    maxOutputTokens?: number
    responseMimeType?: string
}

export class GeminiModel {
    private readonly apiKey: string
    private readonly logger = system.globalLogger()
    private readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
    private readonly model = 'gemini-2.0-flash-exp'

    constructor(apiKey: string) {
        this.logger.info('[GeminiModel] Initializing Gemini model')
        this.apiKey = apiKey
    }

    private getDefaultConfig(): GeminiChatConfig {
        return {
            temperature: 1,
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 8192,
            responseMimeType: 'text/plain',
        }
    }

    async chat(prompt: string, config?: GeminiChatConfig): Promise<string> {
        const requestId = Math.random().toString(36).substring(7)
        const startTime = Date.now()

        this.logger.info({
            requestId,
            step: 'start',
            prompt,
            timestamp: new Date().toISOString(),
        }, '[GeminiModel] Starting chat session')

        try {
            const chatConfig = {
                ...this.getDefaultConfig(),
                ...config,
            }

            this.logger.debug({
                requestId,
                step: 'chat_config',
                config: chatConfig,
                elapsedMs: Date.now() - startTime,
            }, '[GeminiModel] Chat configuration')

            const payload = {
                contents: [
                    {
                        role: 'user',
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
                tools: [
                    {
                        googleSearch: {},
                    },
                  ],
                generationConfig: {
                    temperature: chatConfig.temperature,
                    topK: chatConfig.topK,
                    topP: chatConfig.topP,
                    maxOutputTokens: chatConfig.maxOutputTokens,
                    responseMimeType: chatConfig.responseMimeType,
                },
            }

            const response = await axios.post(
                `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            )

            const responseText = response.data.candidates[0].content.parts[0].text

            this.logger.info({
                requestId,
                step: 'chat_complete',
                elapsedMs: Date.now() - startTime,
            }, '[GeminiModel] Chat session completed')

            return responseText
        } catch (error) {
            this.logger.error({
                requestId,
                step: 'error',
                error,
                prompt,
                stack: error instanceof Error ? error.stack : undefined,
                message: error instanceof Error ? error.message : 'Unknown error',
                elapsedMs: Date.now() - startTime,
            }, '[GeminiModel] Chat session failed')

            throw error
        }
    }
} 