
import { cryptoUtils } from '@activepieces/server-shared'
import { isNil, PlatformRole, SAMLAuthnProviderConfig, User } from '@activepieces/shared'
import { userService } from '../../../user/user-service'
import { createSamlClient, IdpLoginResponse, SamlAttributes } from './saml-client'

export const authnSsoSamlService = {
    async login(platformId: string, samlProvider: SAMLAuthnProviderConfig): Promise<LoginResponse> {
        const client = await createSamlClient(platformId, samlProvider)
        const redirectUrl = client.getLoginUrl()
        return {
            redirectUrl,
        }
    },

    async acs(platformId: string, samlProvider: SAMLAuthnProviderConfig, idpLoginResponse: IdpLoginResponse): Promise<User> {
        const client = await createSamlClient(platformId, samlProvider)
        const attributes = await client.parseAndValidateLoginResponse(idpLoginResponse)
        return getOrCreateUser(platformId, attributes)
    },
}

const getOrCreateUser = async (platformId: string, attributes: SamlAttributes): Promise<User> => {
    const email = attributes.email
    const existingUser = await userService.getByPlatformAndEmail({
        platformId,
        email,
    })
    if (!isNil(existingUser)) {
        return existingUser
    }
    return userService.create({
        email,
        firstName: attributes.firstName??'john',
        lastName: attributes.lastName??'doe',
        password: await cryptoUtils.generateRandomPassword(),
        trackEvents: true,
        newsLetter: false,
        verified: true,
        platformId,
        platformRole: PlatformRole.MEMBER,
    })
}

type LoginResponse = {
    redirectUrl: string
}