import { Static, Type } from '@sinclair/typebox'

export const ActivateKeyRequestBody = Type.Object({
    key: Type.String(),
})

export type ActivateKeyRequestBody = Static<typeof ActivateKeyRequestBody>

export const CreateKeyRequestBody = Type.Object({
    email: Type.String(),
})

export type CreateKeyRequestBody = Static<typeof CreateKeyRequestBody>

export type ActivationKeyEntity = {
    id: string
    expires_at: string
    email: string
    activated_at: string
    created_at: string
    key: string
}