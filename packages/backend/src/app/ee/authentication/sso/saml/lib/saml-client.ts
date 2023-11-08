import axios from 'axios'
import * as saml from 'samlify'
import * as validator from '@authenio/samlify-node-xmllint'

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

        return loginResult.extract.attributes
    }
}

let instance: SamlClient | null = null

export const createSamlClient = async (): Promise<SamlClient> => {
    if (instance) {
        return instance
    }

    saml.setSchemaValidator(validator)
    const idpMetadata = await fetchIdpMetadata()
    const idp = createIdp(idpMetadata)
    const sp = createSp()
    return instance = new SamlClient(idp, sp)
}

const fetchIdpMetadata = async (): Promise<string> => {
    const IDP_METADATA_URL = process.env.IDP_METADATA_URL!
    const response = await axios.get<string>(IDP_METADATA_URL)
    return response.data
}

const createIdp = (metadata: string): saml.IdentityProviderInstance => {
    return saml.IdentityProvider({
        metadata,
        isAssertionEncrypted: true,
        messageSigningOrder: 'encrypt-then-sign',
        wantLogoutRequestSigned: true,
    })
}

const createSp = (): saml.ServiceProviderInstance => {
    const SP_SIGN_PRIVATE_KEY_PEM = process.env.SP_SIGN_PRIVATE_KEY_PEM!
    const SP_ENCRYPT_PRIVATE_KEY_PEM = process.env.SP_ENCRYPT_PRIVATE_KEY_PEM!

    return saml.ServiceProvider({
        entityID: 'http://localhost:3000/v1/authn/sso/saml/sp/metadata',
        authnRequestsSigned: false,
        wantAssertionsSigned: true,
        wantMessageSigned: true,
        wantLogoutResponseSigned: true,
        wantLogoutRequestSigned: true,
        privateKey: SP_SIGN_PRIVATE_KEY_PEM,
        encPrivateKey: SP_ENCRYPT_PRIVATE_KEY_PEM,
        isAssertionEncrypted: true,
        assertionConsumerService: [{
            Binding: saml.Constants.namespace.binding.post,
            Location: 'http://localhost:3000/v1/authn/sso/saml/sp/acs',
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
