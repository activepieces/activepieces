import { anthropic } from '@ai-sdk/anthropic'
import { openai } from '@ai-sdk/openai'
import { createReplicate } from '@ai-sdk/replicate'
import { ImageModel, LanguageModel } from 'ai'

export type SupportedAIProvider = {
    provider: string
    baseUrl: string
    displayName: string
    markdown: string
    logoUrl: string
    auth: {
        headerName: string
        bearer: boolean
    }
    languageModels: {
        displayName: string
        instance: LanguageModel
        functionCalling: boolean
    }[]
    imageModels: {
        displayName: string
        instance: ImageModel
    }[]
}

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
        languageModels: [
            {
                displayName: 'GPT-4o',
                instance: openai('gpt-4o'),
                functionCalling: true,
            },
            {
                displayName: 'GPT-4o Mini',
                instance: openai('gpt-4o-mini'),
                functionCalling: true,
            },
            {
                displayName: 'GPT-4 Turbo',
                instance: openai('gpt-4-turbo'),
                functionCalling: true,
            },
            {
                displayName: 'GPT-3.5 Turbo',
                instance: openai('gpt-3.5-turbo'),
                functionCalling: false,
            },
            {
                displayName: 'GPT-4.1',
                instance: openai('gpt-4.1'),
                functionCalling: true,
            },
            {
                displayName: 'GPT-4.1 Mini',
                instance: openai('gpt-4.1-mini'),
                functionCalling: true,
            },
            {
                displayName: 'GPT-4.1 Nano',
                instance: openai('gpt-4.1-nano'),
                functionCalling: true,
            },
            {
                displayName: 'O3',
                instance: openai('o3'),
                functionCalling: true,
            },
            {
                displayName: 'O3 Mini',
                instance: openai('o3-mini'),
                functionCalling: true,
            },
            {
                displayName: 'O4 Mini',
                instance: openai('o4-mini'),
                functionCalling: true,
            },
        ],
        imageModels: [
            {
                displayName: 'DALL-E 3',
                instance: openai.image('dall-e-3'),
            },
            {
                displayName: 'DALL-E 2',
                instance: openai.image('dall-e-2'),
            },
        ],
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
        languageModels: [
            {
                displayName: 'Claude 3.5 Sonnet',
                instance: anthropic('claude-3-5-sonnet-latest'),
                functionCalling: true,
            },
            {
                displayName: 'Claude 3.5 Haiku',
                instance: anthropic('claude-3-5-haiku-20241022'),
                functionCalling: true,
            },
            {
                displayName: 'Claude 3 Opus',
                instance: anthropic('claude-3-opus-20240229'),
                functionCalling: true,
            },
            {
                displayName: 'Claude 3 Sonnet',
                instance: anthropic('claude-3-sonnet-20240229'),
                functionCalling: true,
            },
            {
                displayName: 'Claude 3 Haiku',
                instance: anthropic('claude-3-haiku-20240307'),
                functionCalling: true,
            },
            {
                displayName: 'Claude 3.7 Sonnet',
                instance: anthropic('claude-3-7-sonnet-latest'),
                functionCalling: true,
            },
        ],
        imageModels: [],
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
        languageModels: [],
        imageModels: [
            {
                displayName: 'bytedance/sdxl-lightning-4step',
                instance: replicate.image('bytedance/sdxl-lightning-4step:5599ed30703defd1d160a25a63321b4dec97101d98b4674bcc56e41f62f35637'),
            },
            {
                displayName: 'stability-ai/stable-diffusion',
                instance: replicate.image('stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4'),
            },
            {
                displayName: 'black-forest-labs/flux-schnell',
                instance: replicate.image('black-forest-labs/flux-schnell'),
            },
        ],
    },
]
