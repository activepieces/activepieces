import jwksClient from 'jwks-rsa'
import { flagService } from '../../../../flags/flag.service'
import { JwtSignAlgorithm, jwtUtils } from '../../../../helper/jwt-utils'
import { AuthnProvider, FebderatedAuthnIdToken } from './authn-provider'
import {
    assertNotEqual,
    assertNotNullOrUndefined,
    Platform,
} from '@activepieces/shared'

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
    ): Promise<FebderatedAuthnIdToken> {
        const { clientId, clientSecret } = getClientIdAndSecret(platform)
        const idToken = await exchangeCodeForIdToken(
            platform.id,
            hostname,
            clientId,
            clientSecret,
            authorizationCode,
        )
        return verifyIdToken(clientId, idToken)
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
): Promise<FebderatedAuthnIdToken> => {
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

    assertNotEqual(payload.email_verified, false, 'payload.email_verified', 'Email is not verified')
    return {
        email: payload.email,
        firstName: payload.given_name,
        lastName: payload.family_name,
    }
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
