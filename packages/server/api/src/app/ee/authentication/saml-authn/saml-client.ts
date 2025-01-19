
import { ActivepiecesError, ErrorCode, SAMLAuthnProviderConfig } from '@activepieces/shared'
import * as validator from '@authenio/samlify-node-xmllint'
import { Type } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'
import * as saml from 'samlify'
import { domainHelper } from '../../custom-domains/domain-helper'


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
    saml.setSchemaValidator(validator)
    const idp = createIdp(samlProvider.idpMetadata)
    const sp = await createSp(platformId, samlProvider.idpCertificate)
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

export type SamlAttributes = {
    email: string
    firstName: string
    lastName: string
}
