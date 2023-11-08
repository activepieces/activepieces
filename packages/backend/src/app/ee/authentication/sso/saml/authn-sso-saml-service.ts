import { User, UserStatus } from '@activepieces/shared'
import { IdpLoginResponse, SamlAttributes, createSamlClient } from './lib/saml-client'
import { userService } from '../../../../user/user-service'
import { generateRandomPassword } from '../../../../helper/crypto'

export const authnSsoSamlService = {
    async login(): Promise<LoginResponse> {
        const client = await createSamlClient()
        const redirectUrl = client.getLoginUrl()

        return {
            redirectUrl,
        }
    },

    async acs(idpLoginResponse: IdpLoginResponse): Promise<User> {
        const client = await createSamlClient()
        const attributes = await client.parseAndValidateLoginResponse(idpLoginResponse)
        return getOrCreateUser(attributes)
    },
}

const getOrCreateUser = async (attributes: SamlAttributes): Promise<User> => {
    const userDetails = {
        email: attributes.email,
        firstName: attributes.firstName,
        lastName: attributes.lastName,
        password: await generateRandomPassword(),
        trackEvents: true,
        newsLetter: true,
        status: UserStatus.EXTERNAL,
    }

    return userService.create(userDetails)
}

type LoginResponse = {
    redirectUrl: string
}
