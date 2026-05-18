import { z } from 'zod'

export const ListVariablesRequestQuery = z.object({
    projectId: z.string(),
    cursor: z.string().optional(),
    limit: z.coerce.number().optional(),
    name: z.string().optional(),
})
export type ListVariablesRequestQuery = z.infer<typeof ListVariablesRequestQuery>

export const RevealVariableResponse = z.object({
    value: z.string(),
})
export type RevealVariableResponse = z.infer<typeof RevealVariableResponse>
