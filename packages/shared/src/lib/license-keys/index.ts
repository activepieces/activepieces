import { Static, Type } from '@sinclair/typebox'

export const VerifyLicenseKeyRequestBody = Type.Object({
    licenseKey: Type.String(),
    platformId: Type.String(),
})

export type VerifyLicenseKeyRequestBody = Static<typeof VerifyLicenseKeyRequestBody>

export const LicenseKeyEntity = Type.Object({
    id: Type.String(),
    email: Type.String(),
    expiresAt: Type.String(),
    activatedAt: Type.String(),
    createdAt: Type.String(),
    key: Type.String(),
    ssoEnabled: Type.Boolean(),
    environmentsEnabled: Type.Boolean(),
    showPoweredBy: Type.Boolean(),
    embeddingEnabled: Type.Boolean(),
    auditLogEnabled: Type.Boolean(),
    customAppearanceEnabled: Type.Boolean(),
    manageProjectsEnabled: Type.Boolean(),
    managePiecesEnabled: Type.Boolean(),
    manageTemplatesEnabled: Type.Boolean(),
    apiKeysEnabled: Type.Boolean(),
    customDomainsEnabled: Type.Boolean(),
    projectRolesEnabled: Type.Boolean(),
    analyticsEnabled: Type.Boolean(),
    globalConnectionsEnabled: Type.Boolean(),
    customRolesEnabled: Type.Boolean(),
    agentsEnabled: Type.Boolean(),
    tablesEnabled: Type.Boolean(),
    todosEnabled: Type.Boolean(),
    mcpsEnabled: Type.Boolean(),
})


export const CreateTrialLicenseKeyRequestBody = Type.Composite([Type.Object({
    email: Type.String(),
    companyName: Type.String(),
    goal: Type.String(),
    keyType: Type.Optional(Type.String()),
}), Type.Omit(LicenseKeyEntity, ['id', 'email', 'expiresAt', 'activatedAt', 'key', 'createdAt'])])

export type CreateTrialLicenseKeyRequestBody = Static<typeof CreateTrialLicenseKeyRequestBody>


export type LicenseKeyEntity = Static<typeof LicenseKeyEntity>
