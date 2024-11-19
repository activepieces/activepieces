import { Static, Type } from '@sinclair/typebox'

export const CreateTrialLicenseKeyRequestBody = Type.Object({
    email: Type.String(),
    fullName: Type.String(),
    companyName: Type.String(),
    goal: Type.String(),
    numberOfEmployees: Type.String(),
})

export type CreateTrialLicenseKeyRequestBody = Static<typeof CreateTrialLicenseKeyRequestBody>

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
    isTrial: Type.Boolean(),
    key: Type.String(),
    ssoEnabled: Type.Boolean(),
    gitSyncEnabled: Type.Boolean(),
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
    flowIssuesEnabled: Type.Boolean(),
    alertsEnabled: Type.Boolean(),
    analyticsEnabled: Type.Boolean(),
    globalConnectionsEnabled: Type.Boolean(),
    customRolesEnabled: Type.Boolean(),
})

export type LicenseKeyEntity = Static<typeof LicenseKeyEntity>
