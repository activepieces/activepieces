import { createOpenAI } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'
import { system } from '../helper/system/system'
import { AppSystemProp } from '../helper/system/system-props'

const COPILOT_MODEL = 'gpt-4o'

export const createPlatformCopilotModel = (): { model: LanguageModel } => {
    const apiKey = system.getOrThrow(AppSystemProp.OPENAI_API_KEY)
    return { model: createOpenAI({ apiKey }).chat(COPILOT_MODEL) }
}
