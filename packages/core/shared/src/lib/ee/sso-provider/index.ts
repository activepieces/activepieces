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
