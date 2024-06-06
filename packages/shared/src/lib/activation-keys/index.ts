import { Static, Type } from '@sinclair/typebox'
import {  PrincipalType } from '../authentication/model/principal-type'


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
    isTrial: boolean
}

const GetKeyRequestParams =  Type.Object({
    key: Type.String(),
})

export type GetKeyRequestParams = Static<typeof GetKeyRequestParams>
export const GetKeyRequest = {
    config: { allowedPrincipals: [
        PrincipalType.USER,
    ] },
    schema: {
        params: GetKeyRequestParams,
    },
}


export const CreateKeyRequest =  {
    config: { allowedPrincipals: [
        PrincipalType.USER,
    ] },
    schema: {
        body: CreateKeyRequestBody,
    },
}
export const ActivateKeyRequest = {
    config: { allowedPrincipals: [
        PrincipalType.USER,
    ] },
    schema: {
        body: ActivateKeyRequestBody,
    },
}