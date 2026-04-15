import { createOpenAI } from '@ai-sdk/openai'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

const MODEL_ID = 'text-embedding-3-small'
const DIMENSIONS = 768

export function createCopilotEmbeddingModel() {
    const apiKey = system.getOrThrow(AppSystemProp.OPENAI_API_KEY)
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is required for copilot embeddings.')
    }
    const model = createOpenAI({ apiKey }).embeddingModel(MODEL_ID)
    return { model, modelId: MODEL_ID, providerOptions: { openai: { dimensions: DIMENSIONS } } }
}
