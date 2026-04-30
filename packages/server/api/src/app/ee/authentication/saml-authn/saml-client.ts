import { safeHttp } from '@activepieces/server-utils'
import { ActivepiecesError, ErrorCode, SAMLAttributeMapping, SAMLAuthnProviderConfig, tryCatch } from '@activepieces/shared'
import * as validator from '@authenio/samlify-node-xmllint'
import * as saml from 'samlify'
import { domainHelper } from '../../../helper/domain-helper'
import { resolveSamlAttributes, SamlAttributes } from './saml-attributes'

export const createSamlClient = async (platformId: string, samlProvider: SAMLAuthnProviderConfig): Promise<SamlClient> => {
    const cached = instanceCache.get(platformId)
    if (cached) {
        return cached
    }
    saml.setSchemaValidator(validator)
    const metadataXml = await resolveIdpMetadata(samlProvider.idpMetadata)
    const idp = createIdp(metadataXml)
    const sp = await createSp({ privateKey: samlProvider.idpCertificate })
    const client = samlClient({ idp, sp, attributeMapping: samlProvider.attributeMapping })
    instanceCache.set(platformId, client)
    return client
}

export const invalidateSamlClientCache = (platformId: string): void => {
    instanceCache.delete(platformId)
}

const samlClient = ({ idp, sp, attributeMapping }: SamlClientArgs) => ({
    getLoginUrl(): string {
        return sp.createLoginRequest(idp, LOGIN_REQUEST_BINDING).context
    },
    async parseAndValidateLoginResponse(idpLoginResponse: IdpLoginResponse): Promise<SamlAttributes> {
        const { data: loginResult, error: parseError } = await tryCatch(
            () => sp.parseLoginResponse(idp, LOGIN_RESPONSE_BINDING, idpLoginResponse),
        )
        if (parseError !== null) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_SAML_RESPONSE,
                params: {
                    message: `Failed to parse SAML response: ${toErrorMessage(parseError)}`,
                },
            })
        }
        return resolveSamlAttributes({
            rawAttributes: loginResult.extract?.attributes,
            mapping: attributeMapping,
        })
    },
})

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
    const { data: response, error } = await tryCatch(() => safeHttp.axios.get<string>(trimmed, {
        responseType: 'text',
        timeout: 10_000,
        maxContentLength: 5 * 1024 * 1024,
        maxBodyLength: 5 * 1024 * 1024,
        transformResponse: (data) => data,
    }))
    if (error !== null) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_SAML_RESPONSE,
            params: {
                message: `Failed to fetch IdP metadata from URL: ${toErrorMessage(error)}`,
            },
        })
    }
    const contentType = String(response.headers['content-type'] ?? '').toLowerCase()
    if (contentType !== '' && !contentType.includes('xml') && !contentType.includes('text/plain')) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_SAML_RESPONSE,
            params: {
                message: `Failed to fetch IdP metadata from URL: Unexpected content-type "${contentType}" — expected XML.`,
            },
        })
    }
    return typeof response.data === 'string' ? response.data : String(response.data)
}

const createSp = async ({ privateKey }: CreateSpArgs): Promise<saml.ServiceProviderInstance> => {
    const acsUrl = await domainHelper.getPublicUrl({ path: '/api/v1/authn/saml/acs' })
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

const toErrorMessage = (error: unknown): string => {
    return error instanceof Error ? error.message : String(error)
}

const LOGIN_REQUEST_BINDING = 'redirect'
const LOGIN_RESPONSE_BINDING = 'post'

const instanceCache = new Map<string, SamlClient>()

type SamlClient = ReturnType<typeof samlClient>

type SamlClientArgs = {
    idp: saml.IdentityProviderInstance
    sp: saml.ServiceProviderInstance
    attributeMapping: SAMLAttributeMapping | undefined
}

type CreateSpArgs = {
    privateKey: string
}

export type IdpLoginResponse = {
    body: Record<string, unknown>
    query: Record<string, unknown>
}

export type { SamlAttributes } from './saml-attributes'
