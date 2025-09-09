import { anthropic } from '@ai-sdk/anthropic'
import { google } from '@ai-sdk/google'
import { openai } from '@ai-sdk/openai'
import { LanguageModelV2 } from '@ai-sdk/provider'
import { createReplicate } from '@ai-sdk/replicate'
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
        pricing: LanguageModelPricing
        webSearchCost?: number
    }[]
    imageModels: {
        displayName: string
        instance: ImageModel
        pricing: ImageModelPricing
    }[]
    videoModels: {
        displayName: string
        instance: { modelId: string }
        pricing: {
            costPerSecond: number
        },
        minimumDurationInSeconds: number
    }[]
}

type TableData<
    TRow extends string,
    TCol extends string,
    TValue,
> = {
    [R in TRow]: {
        [C in TCol]: TValue
    }
}

export type DALLE3PricingPerImage = TableData<
'standard' | 'hd',
'1024x1024' | '1024x1792' | '1792x1024',
number
> & {type: 'DALLE3'}

export type DALLE2PricingPerImage = TableData<
'standard',
'256x256' | '512x512' | '1024x1024',
number
> & {type: 'DALLE2'}

export type GPTImage1PricingPerImage = {
    input: {
        image: number
        text: number
    }
    output: number
} & {type: 'GPTImage1'}

type ImageModelPricing = DALLE3PricingPerImage | DALLE2PricingPerImage | GPTImage1PricingPerImage | number 

// $ per million tokens
export type FlatLanguageModelPricing = {
    input: number
    output: number
    type: 'flat'
}

export type TieredLanguageModelPricing = {
    promptThreshold: number
    input: {
        underThresholdRate: number
        overThresholdRate: number
    }
    output: {
        underThresholdRate: number
        overThresholdRate: number
    }
    type: 'tiered'
}

export type CategorizedLanguageModelPricing = {
    input: {
        default: number
        audio: number
    }
    output: number
    type: 'categorized'
}


type LanguageModelPricing = FlatLanguageModelPricing | TieredLanguageModelPricing | CategorizedLanguageModelPricing

// we define a temp api token here because replicate throws an error if no api token is provided
const replicate = createReplicate({
    apiToken: 'r8_1234567890',
})

export const SUPPORTED_AI_PROVIDERS: SupportedAIProvider[] = [
    {
        provider: 'openai',
        baseUrl: 'https://api.openai.com',
        displayName: 'OpenAI',
        markdown: `Follow these instructions to get your OpenAI API Key:

1. Visit the following website: https://platform.openai.com/account/api-keys.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your OpenAI account and upgrade to the paid plan **before** generating the API Key. This will help you prevent 429 errors.
`,
        logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
        auth: {
            headerName: 'Authorization',
            bearer: true,
        },
        streaming: true,
        languageModels: [
            {
                displayName: 'GPT-5',
                instance: openai('gpt-5'),
                functionCalling: true,
                pricing: {
                    input: 1.25,
                    output: 10.00,
                    type: 'flat',
                },
                webSearchCost: 0.01,
            },
            {
                displayName: 'GPT-5 Chat',
                instance: openai('gpt-5-chat-latest'),
                functionCalling: false,
                pricing: {
                    input: 1.25,
                    output: 10.00,
                    type: 'flat',
                },
                webSearchCost: 0.01,
            },
            {
                displayName: 'GPT-5 Mini',
                instance: openai('gpt-5-mini'),
                functionCalling: true,
                pricing: {
                    input: 0.25,
                    output: 2.00,
                    type: 'flat',
                },
                webSearchCost: 0.01,
            },
            {
                displayName: 'GPT-5 Nano',
                instance: openai('gpt-5-nano'),
                functionCalling: true,
                pricing: {
                    input: 0.05,
                    output: 0.40,
                    type: 'flat',
                },
                webSearchCost: 0.01,
            },
            {
                displayName: 'GPT-4o',
                instance: openai('gpt-4o'),
                functionCalling: true,
                pricing: {
                    input: 2.50,
                    output: 10.00,  
                    type: 'flat',
                },
                webSearchCost: 0.025,
            },
            {
                displayName: 'GPT-4o Mini',
                instance: openai('gpt-4o-mini'),
                functionCalling: true,
                pricing: {
                    input: 0.40,
                    output: 1.60,   
                    type: 'flat',
                },
                webSearchCost: 0.025,
            },
            {
                displayName: 'GPT-4.1',
                instance: openai('gpt-4.1'),
                functionCalling: true,
                pricing: {
                    input: 2.00,
                    output: 8.00,   
                    type: 'flat',
                },
                webSearchCost: 0.025,
            },
            {
                displayName: 'GPT-4.1 Mini',
                instance: openai('gpt-4.1-mini'),
                functionCalling: true,
                pricing: {
                    input: 0.40,
                    output: 1.60,   
                    type: 'flat',
                },
                webSearchCost: 0.025,
            },
            {
                displayName: 'GPT-4.1 Nano',
                instance: openai('gpt-4.1-nano'),
                functionCalling: true,
                pricing: {
                    input: 0.10,
                    output: 0.40,
                    type: 'flat',
                },
            },
            {
                displayName: 'O4 Mini',
                instance: openai('o4-mini'),
                functionCalling: true,
                pricing: {
                    input: 1.10,
                    output: 4.40,   
                    type: 'flat',
                },
                webSearchCost: 0.01,
            },
            {
                displayName: 'O3',
                instance: openai('o3'),
                functionCalling: true,
                pricing: {
                    input: 2.00,
                    output: 8.00,       
                    type: 'flat',
                },
                webSearchCost: 0.01,
            },
            {
                displayName: 'O3 Mini',
                instance: openai('o3-mini'),
                functionCalling: true,
                pricing: {
                    input: 1.10,
                    output: 4.40,   
                    type: 'flat',
                },
                webSearchCost: 0.01,
            },
            {
                displayName: 'GPT-4 Turbo',
                instance: openai('gpt-4-turbo'),
                functionCalling: true,
                pricing: {
                    input: 10.00,
                    output: 30.00,  
                    type: 'flat',
                },
            },
            {
                displayName: 'GPT-3.5 Turbo',
                instance: openai('gpt-3.5-turbo'),
                functionCalling: false,
                pricing: {
                    input: 0.50,
                    output: 1.50,
                    type: 'flat',
                },
            },
        ],
        imageModels: [
            {
                displayName: 'GPT-Image-1',
                instance: openai.image('gpt-image-1'),
                pricing: {
                    input: {
                        image: 10.00,
                        text: 5.00,
                    },
                    output: 40.00,
                    type: 'GPTImage1',
                },
            },
            {
                displayName: 'DALL-E 3',
                instance: openai.image('dall-e-3'),
                pricing: {
                    standard: {
                        '1024x1024': 0.04,
                        '1024x1792': 0.08,
                        '1792x1024': 0.08,
                    },
                    hd: {
                        '1024x1024': 0.08,
                        '1024x1792': 0.12,
                        '1792x1024': 0.12,
                    },
                } as DALLE3PricingPerImage,
            },
            {
                displayName: 'DALL-E 2',
                instance: openai.image('dall-e-2'),
                pricing: {
                    standard: {
                        '256x256': 0.016,
                        '512x512': 0.018,
                        '1024x1024': 0.02,
                    },
                } as DALLE2PricingPerImage,
            },
        ],
        videoModels: [],
    },
    {
        provider: 'anthropic',
        baseUrl: 'https://api.anthropic.com',
        displayName: 'Anthropic',
        markdown: `Follow these instructions to get your Claude API Key:

1. Visit the following website: https://console.anthropic.com/settings/keys.
2. Once on the website, locate and click on the option to obtain your Claude API Key.
`,
        logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
        auth: {
            headerName: 'x-api-key',
            bearer: false,
        },
        streaming: false,
        languageModels: [
            {
                displayName: 'Claude 4 Sonnet',
                instance: anthropic('claude-sonnet-4-20250514'),
                functionCalling: true,
                webSearchCost: 0.01,
                pricing: {
                    input: 3.00,
                    output: 15.00,
                    type: 'flat',
                },
            },
            {
                displayName: 'Claude 3.5 Haiku',
                instance: anthropic('claude-3-5-haiku-20241022'),
                functionCalling: true,
                webSearchCost: 0.01,
                pricing: {
                    input: 0.80,
                    output: 4.00,
                    type: 'flat',
                },
            },
            {
                displayName: 'Claude 4.1 Opus',
                instance: anthropic('claude-opus-4-1-20250805'),
                functionCalling: true,
                webSearchCost: 0.01,
                pricing: {
                    input: 15.00,
                    output: 75.00,
                    type: 'flat',
                },
            },
            {
                displayName: 'Claude 3.7 Sonnet',
                instance: anthropic('claude-3-7-sonnet-20250219'),
                functionCalling: true,
                webSearchCost: 0.01,
                pricing: {
                    input: 3.00,
                    output: 15.00,
                    type: 'flat',
                },
            },
            {
                displayName: 'Claude 3.5 Sonnet',
                instance: anthropic('claude-3-5-sonnet-latest'),
                functionCalling: true,
                webSearchCost: 0.01,
                pricing: {
                    input: 3.00,
                    output: 15.00,
                    type: 'flat',
                },
            },
            {
                displayName: 'Claude 3.5 Sonnet',
                instance: anthropic('claude-3-5-sonnet-latest'),
                functionCalling: true,
                pricing: {
                    input: 3.00,
                    output: 15.00,
                    type: 'flat',
                },
            },
            {
                displayName: 'Claude 3 Opus',
                instance: anthropic('claude-3-opus-20240229'),
                functionCalling: true,
                pricing: {
                    input: 15.00,
                    output: 75.00,
                    type: 'flat',
                },
            },
            {
                displayName: 'Claude 3 Sonnet',
                instance: anthropic('claude-3-sonnet-20240229'),
                functionCalling: true,
                pricing: {
                    input: 3.00,
                    output: 15.00,
                    type: 'flat',
                },
            },
            {
                displayName: 'Claude 3 Haiku',
                instance: anthropic('claude-3-haiku-20240307'),
                functionCalling: true,
                pricing: {
                    input: 0.25,
                    output: 1.25,
                    type: 'flat',
                },
            },
        ],
        imageModels: [],
        videoModels: [],
    },
    {
        provider: 'replicate',
        baseUrl: 'https://api.replicate.com',
        displayName: 'Replicate',
        markdown: `Follow these instructions to get your Replicate API Key:

1. Visit the following website: https://replicate.com/account/api-tokens.
2. Once on the website, locate and click on the option to obtain your Replicate API Key.
`,
        logoUrl: 'https://cdn.activepieces.com/pieces/replicate.png',
        auth: {
            headerName: 'Authorization',
            bearer: true,
        },
        streaming: false,
        languageModels: [],
        imageModels: [
            {
                displayName: 'bytedance/sdxl-lightning-4step',
                instance: replicate.image('bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637'),
                pricing: 0.0014,
            },
            {
                displayName: 'stability-ai/stable-diffusion',
                instance: replicate.image('stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4'),
                pricing: 0.0034,
            },
            {
                displayName: 'black-forest-labs/flux-schnell',
                instance: replicate.image('black-forest-labs/flux-schnell'),
                pricing: 0.003,
            },
        ],
        videoModels: []
    },
    {
        provider: 'google',
        baseUrl: 'https://generativelanguage.googleapis.com',
        displayName: 'Google Gemini',
        markdown: `Follow these instructions to get your Google API Key:
1. Visit the following website: https://console.cloud.google.com/apis/credentials.
2. Once on the website, locate and click on the option to obtain your Google API Key.
`,
        logoUrl: 'https://cdn.activepieces.com/pieces/google-gemini.png',
        auth: {
            headerName: 'x-goog-api-key',
            bearer: false,
        },
        streaming: false,
        languageModels: [
            {
                displayName: 'Gemini 2.5 Pro',
                instance: google('gemini-2.5-pro'),
                functionCalling: true,
                webSearchCost: 0.035,
                pricing: {
                    promptThreshold: 200_000,
                    input: {
                        underThresholdRate: 1.25,
                        overThresholdRate: 2.50,
                    },
                    output: {
                        underThresholdRate: 10.00,
                        overThresholdRate: 15.00,
                    },  
                    type: 'tiered',
                },
            },
            {
                displayName: 'Gemini 2.5 Flash',
                instance: google('gemini-2.5-flash'),
                functionCalling: true,
                webSearchCost: 0.035,
                pricing: {
                    input: {
                        default: 0.30,
                        audio: 1.00,
                    },
                    output: 2.50,
                    type: 'categorized',
                },
            },
            {
                displayName: 'Gemini 2.5 Flash-Lite Preview',
                instance: google('gemini-2.5-flash-lite-preview-06-17'),
                functionCalling: true,
                webSearchCost: 0.035,
                pricing: {
                    input: {
                        default: 0.10,
                        audio: 0.50,
                    },
                    output: 0.40,   
                    type: 'categorized',
                },
            },
            {
                displayName: 'Gemini 2.0 Flash-Lite',
                instance: google('gemini-2.0-flash-lite'),
                functionCalling: true,
                webSearchCost: 0.035,
                pricing: {
                    input: 0.075,
                    output: 0.30,
                    type: 'flat',
                },
            },
        ],
        imageModels: [ {
            displayName: 'Gemini 2.5 Flash Image Preview (Nano Banana)',
            instance: google.image('gemini-2.5-flash-image-preview'),
            pricing: {
                input: {
                    image: 0.30,
                    text: 0.30
                },
                output: 30.0,
                type: 'GPTImage1',
            }
        }],
        videoModels: [
            {
                displayName: 'VEO 3 Preview',
                instance: { modelId: 'veo-3.0-generate-preview' },
                pricing: {
                    costPerSecond: 0.75,
                },  
                minimumDurationInSeconds: 8,
            },
            {
                displayName: 'VEO 3 Fast Preview',
                instance: { modelId: 'veo-3.0-fast-generate-preview' },
                pricing: {
                    costPerSecond: 0.40,    
                },
                minimumDurationInSeconds: 8,
            },
            {
                displayName: 'VEO 2',
                instance: { modelId: 'veo-2.0-generate-001' },
                pricing: {
                    costPerSecond: 0.35,
                },
                minimumDurationInSeconds: 8,
            },
        ],
    },
]
