
import * as validator from '@authenio/samlify-node-xmllint'
import { Type } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import * as saml from 'samlify'
import { customDomainService } from '../../custom-domains/custom-domain.service'
import { ActivepiecesError, ErrorCode, isNil, SAMLAuthnProviderConfig } from '@activepieces/shared'


const samlResponseValidator = TypeCompiler.Compile(
    Type.Object({
        email: Type.String(),
        firstName: Type.String(),
        lastName: Type.String(),
    }),
)

class SamlClient {
    private static readonly LOGIN_REQUEST_BINDING = 'redirect'
    private static readonly LOGIN_RESPONSE_BINDING = 'post'

    constructor(
        private readonly idp: saml.IdentityProviderInstance,
        private readonly sp: saml.ServiceProviderInstance,
    ) {}

    getLoginUrl(): string {
        const loginRequest = this.sp.createLoginRequest(
            this.idp,
            SamlClient.LOGIN_REQUEST_BINDING,
        )

        return loginRequest.context
    }

    async parseAndValidateLoginResponse(idpLoginResponse: IdpLoginResponse): Promise<SamlAttributes> {
        const loginResult = await this.sp.parseLoginResponse(
            this.idp,
            SamlClient.LOGIN_RESPONSE_BINDING,
            idpLoginResponse,
        )

        const atts = loginResult.extract.attributes
        if (!samlResponseValidator.Check(atts)) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_SAML_RESPONSE,
                params: {
                    message: 'Invalid SAML response, It should contain these firstName, lastName, email fields.',
                },
            
            })
        }
        return atts
    }
}

let instance: SamlClient | null = null

export const createSamlClient = async (platformId: string, samlProvider: SAMLAuthnProviderConfig): Promise<SamlClient> => {
    if (instance) {
        return instance
    }
    const customDomain = await customDomainService.getOneByPlatform({
        platformId,
    })
    if (isNil(customDomain)) {
        throw new ActivepiecesError({
            code: ErrorCode.ENTITY_NOT_FOUND,
            params: {
                entityId: platformId,
                entityType: 'CustomDomain',
                message: 'Please configure a custom domain for this platform.',
            },
        })
    }

    saml.setSchemaValidator(validator)
    const idp = createIdp(samlProvider.idpMetadata)
    const sp = createSp(customDomain.domain, samlProvider.idpCertificate)
    return instance = new SamlClient(idp, sp)
}

const createIdp = (metadata: string): saml.IdentityProviderInstance => {
    return saml.IdentityProvider({
        metadata,
        isAssertionEncrypted: false,
        messageSigningOrder: 'encrypt-then-sign',
        wantLogoutRequestSigned: true,
    })
}

const createSp = (domain: string, privateKey: string): saml.ServiceProviderInstance => {
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
            Location: `https://${domain}/api/v1/authn/saml/acs`,
        }],
        signatureConfig: {},
    })
}

export type IdpLoginResponse = {
    body: Record<string, unknown>
    query: Record<string, unknown>
}

export type SamlAttributes = {
    email: string
    firstName: string
    lastName: string
}
