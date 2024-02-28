import jwksClient from 'jwks-rsa'
import {
    AuthenticationResponse,
    Platform,
    assertNotNullOrUndefined,
} from '@activepieces/shared'
import { AuthnProvider } from './authn-provider'
import { authenticationService } from '../../../../authentication/authentication-service'
import { jwtUtils, JwtSignAlgorithm } from '../../../../helper/jwt-utils'
import { flagService } from '../../../../flags/flag.service'

const JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs'

const keyLoader = jwksClient({
    rateLimit: true,
    cache: true,
    jwksUri: JWKS_URI,
})

function getClientIdAndSecret(platform: Platform): {
    clientId: string
    clientSecret: string
} {
    const clientInformation = platform.federatedAuthProviders.google
    assertNotNullOrUndefined(
        clientInformation,
        'Google information is not configured for this platform',
    )
    return {
        clientId: clientInformation.clientId,
        clientSecret: clientInformation.clientSecret,
    }
}

export const googleAuthnProvider: AuthnProvider = {
    async getLoginUrl(hostname: string, platform: Platform): Promise<string> {
        const { clientId } = getClientIdAndSecret(platform)
        const loginUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
        loginUrl.searchParams.set('client_id', clientId)
        loginUrl.searchParams.set(
            'redirect_uri',
            flagService.getThirdPartyRedirectUrl(platform.id, hostname),
        )
        loginUrl.searchParams.set('scope', 'email profile')
        loginUrl.searchParams.set('response_type', 'code')

        return loginUrl.href
    },

    async authenticate(
        hostname,
        platform,
        authorizationCode,
    ): Promise<AuthenticationResponse> {
        const { clientId, clientSecret } = getClientIdAndSecret(platform)
        const idToken = await exchangeCodeForIdToken(
            platform.id,
            hostname,
            clientId,
            clientSecret,
            authorizationCode,
        )
        const idTokenPayload = await verifyIdToken(clientId, idToken)
        return generateAuthenticationResponse(platform.id, idTokenPayload)
    },
}

const exchangeCodeForIdToken = async (
    platformId: string,
    hostName: string,
    clientId: string,
    clientSecret: string,
    code: string,
): Promise<string> => {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: flagService.getThirdPartyRedirectUrl(platformId, hostName),
            grant_type: 'authorization_code',
        }),
    })

    const { id_token: idToken } = await response.json()
    return idToken
}

const verifyIdToken = async (
    clientId: string,
    idToken: string,
): Promise<IdTokenPayload> => {
    const { header } = jwtUtils.decode({ jwt: idToken })
    const signingKey = await keyLoader.getSigningKey(header.kid)
    const publicKey = signingKey.getPublicKey()

    const payload = await jwtUtils.decodeAndVerify<IdTokenPayloadRaw>({
        jwt: idToken,
        key: publicKey,
        issuer: ['accounts.google.com', 'https://accounts.google.com'],
        algorithm: JwtSignAlgorithm.RS256,
        audience: clientId,
    })

    return {
        email: payload.email,
        emailVerified: payload.email_verified,
        givenName: payload.given_name,
        familyName: payload.family_name,
    }
}

const generateAuthenticationResponse = async (
    platformId: string | null,
    idTokenPayload: IdTokenPayload,
): Promise<AuthenticationResponse> => {
    return authenticationService.federatedAuthn({
        email: idTokenPayload.email,
        verified: true,
        firstName: idTokenPayload.givenName,
        lastName: idTokenPayload.familyName,
        platformId,
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
