import { BaseModelSchema } from '@activepieces/core-utils'
import { z } from 'zod'
import { SAMLAttributeMapping } from '../../core/federated-authn'

export enum SsoProviderProtocol {
    SAML = 'SAML',
}

export enum SsoProviderStatus {
    ENABLED = 'ENABLED',
    DISABLED = 'DISABLED',
    DRAFT = 'DRAFT',
}

export enum SsoProviderVendor {
    OKTA = 'OKTA',
    ENTRA_ID = 'ENTRA_ID',
    GOOGLE_WORKSPACE = 'GOOGLE_WORKSPACE',
    JUMPCLOUD = 'JUMPCLOUD',
    ONELOGIN = 'ONELOGIN',
    KEYCLOAK = 'KEYCLOAK',
    AUTHENTIK = 'AUTHENTIK',
    AUTH0 = 'AUTH0',
    GENERIC = 'GENERIC',
}

export const SamlSsoProviderConfig = z.object({
    idpMetadata: z.string(),
    idpCertificate: z.string(),
    attributeMapping: SAMLAttributeMapping.optional(),
    spEntityId: z.string(),
})

export type SamlSsoProviderConfig = z.infer<typeof SamlSsoProviderConfig>

const SsoProviderBase = {
    ...BaseModelSchema,
    platformId: z.string(),
    vendor: z.enum([
        SsoProviderVendor.OKTA,
        SsoProviderVendor.ENTRA_ID,
        SsoProviderVendor.GOOGLE_WORKSPACE,
        SsoProviderVendor.JUMPCLOUD,
        SsoProviderVendor.ONELOGIN,
        SsoProviderVendor.KEYCLOAK,
        SsoProviderVendor.AUTHENTIK,
        SsoProviderVendor.AUTH0,
        SsoProviderVendor.GENERIC,
    ]),
    status: z.enum([
        SsoProviderStatus.ENABLED,
        SsoProviderStatus.DISABLED,
        SsoProviderStatus.DRAFT,
    ]),
}

export const SamlSsoProvider = z.object({
    ...SsoProviderBase,
    protocol: z.literal(SsoProviderProtocol.SAML),
    config: SamlSsoProviderConfig,
})

export type SamlSsoProvider = z.infer<typeof SamlSsoProvider>

export const SsoProvider = z.discriminatedUnion('protocol', [SamlSsoProvider])

export type SsoProvider = z.infer<typeof SsoProvider>
