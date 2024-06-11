import { Static, Type } from '@sinclair/typebox'
import {  PrincipalType } from '../authentication/model/principal-type'




export const CreateTrialLicenseKeyRequestBody = Type.Object({
    email: Type.String(),
})

export type CreateTrialLicenseKeyRequestBody = Static<typeof CreateTrialLicenseKeyRequestBody>

export type LicenseKeyFeatures = { 
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
export type LicenseKeyEntity = {
    id: string
    expires_at: string
    email: string
    activated_at: string
    created_at: string
    key: string
    isTrial: boolean
    features: LicenseKeyFeatures
}

export const turnedOffFeatures: LicenseKeyFeatures = {
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

export const CreateTrialLicenseKeyRequest =  {
    config: { allowedPrincipals: [
        PrincipalType.USER,
    ] },
    schema: {
        body: CreateTrialLicenseKeyRequestBody,
    },
}


export type LicenseKeyStatus = {
    valid: boolean
    isTrial: boolean
    expirayDate: string | undefined
}