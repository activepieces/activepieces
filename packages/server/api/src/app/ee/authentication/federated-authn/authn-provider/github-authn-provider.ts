import {
    ActivepiecesError,
    AuthenticationResponse,
    ErrorCode,
    Platform,
    assertNotNullOrUndefined,
    isNil,
} from '@activepieces/shared'
import { AuthnProvider } from './authn-provider'
import { authenticationService } from '../../../../authentication/authentication-service'
import { flagService } from '../../../../flags/flag.service'

function getClientIdAndSecret(platform: Platform): {
    clientId: string
    clientSecret: string
} {
    const clientInformation = platform.federatedAuthProviders.github
    assertNotNullOrUndefined(
        clientInformation,
        'Github information is not configured for this platform',
    )
    return {
        clientId: clientInformation.clientId,
        clientSecret: clientInformation.clientSecret,
    }
}

export const gitHubAuthnProvider: AuthnProvider = {
    async getLoginUrl(hostname: string, platform: Platform): Promise<string> {
        const { clientId } = getClientIdAndSecret(platform)
        const loginUrl = new URL('https://github.com/login/oauth/authorize')
        loginUrl.searchParams.set('client_id', clientId)
        loginUrl.searchParams.set(
            'redirect_uri',
            flagService.getThirdPartyRedirectUrl(platform.id, hostname),
        )
        loginUrl.searchParams.set('scope', 'user:email')

        return loginUrl.href
    },

    async authenticate(
        hostname,
        platform,
        authorizationCode,
    ): Promise<AuthenticationResponse> {
        const { clientId, clientSecret } = getClientIdAndSecret(platform)
        const githubAccessToken = await getGitHubAccessToken(
            platform,
            hostname,
            clientId,
            clientSecret,
            authorizationCode,
        )
        const gitHubUserInfo = await getGitHubUserInfo(githubAccessToken)
        return authenticateUser(platform.id, gitHubUserInfo)
    },
}

const getGitHubAccessToken = async (
    platform: Platform,
    hostname: string,
    clientId: string,
    clientSecret: string,
    authorizationCode: string,
): Promise<string> => {
    const response = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code: authorizationCode,
            redirect_uri: flagService.getThirdPartyRedirectUrl(platform.id, hostname),
        }),
    })

    if (!response.ok) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CREDENTIALS,
            params: null,
        })
    }

    const responseFormData = await response.formData()
    const accessToken = responseFormData.get('access_token')?.toString()

    if (isNil(accessToken)) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CREDENTIALS,
            params: null,
        })
    }

    return accessToken
}

const getGitHubUserInfo = async (
    gitHubAccessToken: string,
): Promise<GitHubUserInfo> => {
    const response = await fetch('https://api.github.com/user', {
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `token ${gitHubAccessToken}`,
            'X-GitHub-Api-Version': '2022-11-28',
        },
    })

    if (!response.ok) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CREDENTIALS,
            params: null,
        })
    }

    return {
        ...(await response.json()),
        email: await getGitHubUserEmail(gitHubAccessToken),
    }
}

const getGitHubUserEmail = async (
    gitHubAccessToken: string,
): Promise<string> => {
    const response = await fetch('https://api.github.com/user/emails', {
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `token ${gitHubAccessToken}`,
            'X-GitHub-Api-Version': '2022-11-28',
        },
    })

    if (!response.ok) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_CREDENTIALS,
            params: null,
        })
    }
    const emails: { primary: boolean, email: string }[] = await response.json()

    const email = emails.find((email) => email.primary)?.email
    if (!email) {
        throw new Error('Can\'t find email for the github account')
    }
    return email
}
const authenticateUser = async (
    platformId: string | null,
    gitHubUserInfo: GitHubUserInfo,
): Promise<AuthenticationResponse> => {
    return authenticationService.federatedAuthn({
        email: gitHubUserInfo.email,
        verified: true,
        firstName: gitHubUserInfo.name,
        lastName: '',
        platformId,
    })
}

type GitHubUserInfo = {
    name: string
    email: string
}
