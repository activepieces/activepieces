
import { safeHttp } from '@activepieces/server-utils'
import { ActivepiecesError, ErrorCode, SAMLAttributeMapping, SAMLAuthnProviderConfig, tryCatch } from '@activepieces/shared'
import * as validator from '@authenio/samlify-node-xmllint'
import * as saml from 'samlify'
import { domainHelper } from '../../custom-domains/domain-helper'
import { resolveSamlAttributes, SamlAttributes } from './saml-attributes'

class SamlClient {
    private static readonly LOGIN_REQUEST_BINDING = 'redirect'
    private static readonly LOGIN_RESPONSE_BINDING = 'post'

    constructor(
        private readonly idp: saml.IdentityProviderInstance,
        private readonly sp: saml.ServiceProviderInstance,
        private readonly attributeMapping: SAMLAttributeMapping | undefined,
    ) {}

    getLoginUrl(): string {
        const loginRequest = this.sp.createLoginRequest(
            this.idp,
            SamlClient.LOGIN_REQUEST_BINDING,
        )

        return loginRequest.context
    }

    async parseAndValidateLoginResponse(idpLoginResponse: IdpLoginResponse): Promise<SamlAttributes> {
        const { data: loginResult, error: parseError } = await tryCatch(() => this.sp.parseLoginResponse(
            this.idp,
            SamlClient.LOGIN_RESPONSE_BINDING,
            idpLoginResponse,
        ))
        if (parseError !== null) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_SAML_RESPONSE,
                params: {
                    message: `Failed to parse SAML response: ${parseError.message}`,
                },
            })
        }
        const rawAttributes = loginResult.extract?.attributes
        return resolveSamlAttributes({ rawAttributes, mapping: this.attributeMapping })
    }
}

const instanceCache = new Map<string, SamlClient>()

export const createSamlClient = async (platformId: string, samlProvider: SAMLAuthnProviderConfig): Promise<SamlClient> => {
    const cached = instanceCache.get(platformId)
    if (cached) {
        return cached
    }
    saml.setSchemaValidator(validator)
    const metadataXml = await resolveIdpMetadata(samlProvider.idpMetadata)
    const idp = createIdp(metadataXml)
    const sp = await createSp(platformId, samlProvider.idpCertificate)
    const client = new SamlClient(idp, sp, samlProvider.attributeMapping)
    instanceCache.set(platformId, client)
    return client
}

export const invalidateSamlClientCache = (platformId: string): void => {
    instanceCache.delete(platformId)
}

const createIdp = (metadata: string): saml.IdentityProviderInstance => {
    return saml.IdentityProvider({
        metadata,
        isAssertionEncrypted: false,
        messageSigningOrder: 'encrypt-then-sign',
        wantLogoutRequestSigned: true,
    })
}

const resolveIdpMetadata = async (idpMetadata: string): Promise<string> => {
    const trimmed = idpMetadata.trim()
    if (!/^https?:\/\//i.test(trimmed)) {
        return idpMetadata
    }
    try {
        const response = await safeHttp.axios.get<string>(trimmed, {
            responseType: 'text',
            timeout: 10_000,
            maxContentLength: 5 * 1024 * 1024,
            maxBodyLength: 5 * 1024 * 1024,
            transformResponse: (data) => data,
        })
        const contentType = String(response.headers['content-type'] ?? '').toLowerCase()
        if (contentType !== '' && !contentType.includes('xml') && !contentType.includes('text/plain')) {
            throw new Error(`Unexpected content-type "${contentType}" — expected XML.`)
        }
        return typeof response.data === 'string' ? response.data : String(response.data)
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_SAML_RESPONSE,
            params: {
                message: `Failed to fetch IdP metadata from URL: ${message}`,
            },
        })
    }
}

const createSp = async (platformId: string, privateKey: string): Promise<saml.ServiceProviderInstance> => {
    const acsUrl = await domainHelper.getPublicUrl({ path: '/api/v1/authn/saml/acs', platformId })
    return saml.ServiceProvider({
        entityID: 'Activepieces',
        authnRequestsSigned: false,
        wantMessageSigned: true,
        wantLogoutResponseSigned: true,
        wantLogoutRequestSigned: true,
        privateKey,
        isAssertionEncrypted: true,
        assertionConsumerService: [{
            Binding: saml.Constants.namespace.binding.post,
            Location: acsUrl,
        }],
        signatureConfig: {},
    })
}

export type IdpLoginResponse = {
    body: Record<string, unknown>
    query: Record<string, unknown>
}

export type { SamlAttributes } from './saml-attributes'
