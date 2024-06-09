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

type ActivationKeyFeatures = { 
    ssoEnabled: boolean
    gitSyncEnabled: boolean
    showPoweredBy: boolean
    embeddingEnabled: boolean
    auditLogEnabled: boolean
    customAppearanceEnabled: boolean
    manageProjectsEnabled: boolean
    managePiecesEnabled: boolean
    manageTemplatesEnabled: boolean
    apiKeysEnabled: boolean
    customDomainsEnabled: boolean
    projectRolesEnabled: boolean
    flowIssuesEnabled: boolean
    alertsEnabled: boolean
    premiumPieces: string[]
}
export type ActivationKeyEntity = {
    id: string
    expires_at: string
    email: string
    activated_at: string
    created_at: string
    key: string
    isTrial: boolean
    features: ActivationKeyFeatures
}

export const turnedOffFeatures: ActivationKeyFeatures = {
    ssoEnabled: false,
    gitSyncEnabled: false,
    showPoweredBy: false,
    embeddingEnabled: false,
    auditLogEnabled: false,
    customAppearanceEnabled: false,
    manageProjectsEnabled: false,
    managePiecesEnabled: false,
    manageTemplatesEnabled: false,
    apiKeysEnabled: false,
    customDomainsEnabled: false,
    projectRolesEnabled: false,
    flowIssuesEnabled: false,
    alertsEnabled: false,
    premiumPieces: [],
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