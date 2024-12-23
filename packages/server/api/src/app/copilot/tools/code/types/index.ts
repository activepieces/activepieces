import { z } from 'zod'

export type Message = {
    role: 'user' | 'assistant'
    content: string
}

export type CodeAgentResponse = {
    code: string
    inputs: Record<string, string>
    icon: string | undefined
    title: string
}

export const codeGenerationSchema = z.object({
    code: z.string(),
    inputs: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        suggestedValue: z.string().optional(),
    })).default([]),
    title: z.string().optional(),
})

export const defaultResponse: CodeAgentResponse = {
    code: '',
    inputs: {},
    icon: undefined,
    title: 'Custom Code',
} 