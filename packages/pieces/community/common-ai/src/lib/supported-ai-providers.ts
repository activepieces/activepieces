import { LanguageModelV2 } from '@ai-sdk/provider'
import { ImageModel } from 'ai'

export type SupportedAIProvider = {
    provider: string
    baseUrl: string
    displayName: string
    markdown: string
    logoUrl: string
    streaming: boolean
    auth: {
        headerName: string
        bearer: boolean
    }
    languageModels: {
        displayName: string
        instance: LanguageModelV2
        functionCalling: boolean
        webSearchCost?: number
    }[]
    imageModels: {
        displayName: string
        instance: ImageModel
    }[]
    videoModels: {
        displayName: string
        instance: { modelId: string }
        minimumDurationInSeconds: number
    }[]
}

export const SUPPORTED_AI_PROVIDERS: SupportedAIProvider[] = []
