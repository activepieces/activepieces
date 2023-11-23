import { AuthenticationResponse } from '@activepieces/shared'

export type AuthnProvider = {
    getLoginUrl: () => Promise<string>
    authenticate: (authorizationCode: string) => Promise<AuthenticationResponse>
}
