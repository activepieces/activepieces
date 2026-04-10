import { z } from 'zod'

export const VerifyLicenseKeyRequestBody = z.object({
    licenseKey: z.string(),
    platformId: z.string(),
})

export type VerifyLicenseKeyRequestBody = z.infer<typeof VerifyLicenseKeyRequestBody>

export const LicenseKeyEntity = z.object({
    id: z.string(),
    email: z.string(),
    expiresAt: z.string(),
    activatedAt: z.string(),
    createdAt: z.string(),
    key: z.string(),
    ssoEnabled: z.boolean(),
    scimEnabled: z.boolean(),
    environmentsEnabled: z.boolean(),
    showPoweredBy: z.boolean(),
    embeddingEnabled: z.boolean(),
    auditLogEnabled: z.boolean(),
    customAppearanceEnabled: z.boolean(),
    manageProjectsEnabled: z.boolean(),
    managePiecesEnabled: z.boolean(),
    manageTemplatesEnabled: z.boolean(),
    apiKeysEnabled: z.boolean(),
    customDomainsEnabled: z.boolean(),
    projectRolesEnabled: z.boolean(),
    analyticsEnabled: z.boolean(),
    globalConnectionsEnabled: z.boolean(),
    customRolesEnabled: z.boolean(),
    eventStreamingEnabled: z.boolean(),
    secretManagersEnabled: z.boolean(),
    agentsEnabled: z.boolean(),
    aiProvidersEnabled: z.boolean(),
})


export const CreateTrialLicenseKeyRequestBody = z.object({
    email: z.string(),
    companyName: z.string(),
    goal: z.string(),
    keyType: z.string().optional(),
}).merge(LicenseKeyEntity.omit({ id: true, email: true, expiresAt: true, activatedAt: true, key: true, createdAt: true }))

export type CreateTrialLicenseKeyRequestBody = z.infer<typeof CreateTrialLicenseKeyRequestBody>


export type LicenseKeyEntity = z.infer<typeof LicenseKeyEntity>
