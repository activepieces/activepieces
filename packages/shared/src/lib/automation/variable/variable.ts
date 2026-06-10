import { z } from 'zod'
import { BaseModel, BaseModelSchema, Nullable } from '../../core/common/base-model'
import { Metadata } from '../../core/common/metadata'
import { UserWithMetaInformation } from '../../core/user'

export const VARIABLE_NAME_REGEX = /^[a-zA-Z0-9_]+$/

export type VariableId = string

export type VariableValue = {
    secret_text: string
}

export type Variable = BaseModel<VariableId> & {
    name: string
    projectId: string
    platformId: string
    ownerId: string | null
    owner: UserWithMetaInformation | null
    metadata: Metadata | null
    value: VariableValue
}

export const VariableWithoutSensitiveData = z.object({
    ...BaseModelSchema,
    name: z.string(),
    projectId: z.string(),
    platformId: z.string(),
    ownerId: Nullable(z.string()),
    owner: Nullable(UserWithMetaInformation),
    metadata: Nullable(Metadata),
}).describe('A project-scoped encrypted variable that flows can reference via {{variables[\'NAME\']}}.')
export type VariableWithoutSensitiveData = z.infer<typeof VariableWithoutSensitiveData>
