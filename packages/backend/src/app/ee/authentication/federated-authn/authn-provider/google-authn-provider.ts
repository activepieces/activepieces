import jwksClient from 'jwks-rsa'
import { AuthenticationResponse, UserStatus } from '@activepieces/shared'
import { AuthnProvider } from './authn-provider'
import { authenticationService } from '../../../../authentication/authentication-service'
import { jwtUtils, JwtSignAlgorithm } from '../../../../helper/jwt-utils'
import { system } from '../../../../helper/system/system'
import { SystemProp } from '../../../../helper/system/system-prop'
import { flagService } from '../../../../flags/flag.service'

function getClientId(): string {
    return system.getOrThrow(SystemProp.FEDERATED_AUTHN_GOOGLE_CLIENT_ID)
}

function getClientSecret(): string {
    return system.getOrThrow(SystemProp.FEDERATED_AUTHN_GOOGLE_CLIENT_SECRET)
}

const JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs'

const keyLoader = jwksClient({
    rateLimit: true,
    cache: true,
    jwksUri: JWKS_URI,
})

export const googleAuthnProvider: AuthnProvider = {
    async getLoginUrl(): Promise<string> {
        const loginUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
        loginUrl.searchParams.set('client_id', getClientId())
        loginUrl.searchParams.set('redirect_uri', flagService.getThirdPartyRedirectUrl())
        loginUrl.searchParams.set('scope', 'email profile')
        loginUrl.searchParams.set('response_type', 'code')

        return loginUrl.href
    },

    async authenticate(authorizationCode): Promise<AuthenticationResponse> {
        const idToken = await exchangeCodeForIdToken(authorizationCode)
        const idTokenPayload = await verifyIdToken(idToken)
        return generateAuthenticationResponse(idTokenPayload)
    },
    isConfiguredByUser(): boolean {
        return !!system.get(SystemProp.FEDERATED_AUTHN_GOOGLE_CLIENT_SECRET) && !!system.get(SystemProp.FEDERATED_AUTHN_GOOGLE_CLIENT_ID)
    },
}

const exchangeCodeForIdToken = async (code: string): Promise<string> => {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            code,
            client_id: getClientId(),
            client_secret: getClientSecret(),
            redirect_uri: flagService.getThirdPartyRedirectUrl(),
            grant_type: 'authorization_code',
        }),
    })

    const { id_token: idToken } = await response.json()
    return idToken
}

const verifyIdToken = async (idToken: string): Promise<IdTokenPayload> => {
    const { header } = jwtUtils.decode({ jwt: idToken })
    const signingKey = await keyLoader.getSigningKey(header.kid)
    const publicKey = signingKey.getPublicKey()

    const payload = await jwtUtils.decodeAndVerify<IdTokenPayloadRaw>({
        jwt: idToken,
        key: publicKey,
        issuer: ['accounts.google.com', 'https://accounts.google.com'],
        algorithm: JwtSignAlgorithm.RS256,
        audience: getClientId(),
    })

    return {
        email: payload.email,
        emailVerified: payload.email_verified,
        givenName: payload.given_name,
        familyName: payload.family_name,
    }
}

const generateAuthenticationResponse = async (idTokenPayload: IdTokenPayload): Promise<AuthenticationResponse> => {
    return authenticationService.federatedAuthn({
        email: idTokenPayload.email,
        userStatus: UserStatus.VERIFIED,
        firstName: idTokenPayload.givenName,
        lastName: idTokenPayload.familyName,
        platformId: null,
    })
}

type IdTokenPayloadRaw = {
    email: string
    email_verified: boolean
    given_name: string
    family_name: string
    sub: string
    aud: string
    iss: string
}

type IdTokenPayload = {
    email: string
    emailVerified: boolean
    givenName: string
    familyName: string
}
