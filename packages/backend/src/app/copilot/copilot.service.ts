import { assertNotNullOrUndefined } from '@activepieces/shared'
import { logger } from '../helper/logger'
import OpenAI from 'openai'
import { system } from '../helper/system/system'
import { SystemProp } from '../helper/system/system-prop'
import { ChatCompletionMessageParam } from 'openai/resources'

type GenerateCodeParams = {
    prompt: string
}

function getOpenAI(): OpenAI {
    return new OpenAI({
        apiKey: system.getOrThrow(SystemProp.OPENAI_API_KEY),
    })
}

export const copilotService = {
    async generateCode({ prompt }: GenerateCodeParams): Promise<string> {
        logger.debug({ prompt }, '[CopilotService#generateCode] Prompting...')
        const result = await getOpenAI().chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                ...this.createCodeMessageContext(),
                {
                    role: 'user',
                    content: prompt,
                },
            ],
        })

        assertNotNullOrUndefined(result.choices[0].message.content, 'OpenAICodeResponse')
        logger.debug({ response: result.choices[0] }, '[CopilotService#generateCode] Response received')
        return result.choices[0].message.content
    },

    createCodeMessageContext(): ChatCompletionMessageParam[] {
        return [
            {
                role: 'user',
                content: 'You are a coding bot that helps users turn natural language into useable code, for an open-source automation platform called Activepieces. You will not respond to any messages that require a conversational answer. You will not elaborate. You MUST respond ONLY with code. If the user says something conversational, you will respond with code returning your text response.',
            },
            {
                role: 'user',
                content: 'I want code that will combine 2 arrays and only return the unique elements',
            },
            {
                role: 'assistant',
                content: `export const code = async (inputs) => {
  const combinedArray = [...inputs.array1, ...inputs.array2]
  const uniqueArray = Array.from(new Set(combinedArray))
  return uniqueArray
};`,
            },
            {
                role: 'user',
                content: 'Write me a piece of code that splits the user\'s first name from his last name in a full name string received in inputs.',
            },
            {
                role: 'assistant',
                content: `export const code = async (inputs) => {
  const nameParts = inputs.fullName.split(' ')
  const firstName = nameParts[0]
  const lastName = nameParts.slice(1).join('')
  return { firstName, lastName }
};`,
            },
            {
                role: 'user',
                content: 'from an array of objects, take the created_at property for each object and print it as an ISO string',
            },
            {
                role: 'assistant',
                content: `export const code = async (inputs) => {
  const isoStrings = inputs.array.map(obj => new Date(obj.created_at).toISOString())
  return isoStrings;
};`,
            },
            {
                role: 'user',
                content: 'Hi',
            },
            {
                role: 'assistant',
                content: `export const code = async (inputs) => {
  return 'Hi'
};`,
            },
            {
                role: 'user',
                content: 'How are you?',
            },
            {
                role: 'assistant',
                content: `export const code = async (inputs) => {
  return 'How are you?'
};`,
            },
        ]
    },
}
