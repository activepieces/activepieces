import { BaseOAuth2ConnectionValue, OAuth2GrantType, deleteProps } from '@activepieces/shared'

export const oauth2Util = {
    formatOAuth2Response,
    isExpired,
}

function isExpired(connection: BaseOAuth2ConnectionValue): boolean {
    const secondsSinceEpoch = Math.round(Date.now() / 1000)
    const grantType = connection.grant_type ?? OAuth2GrantType.AUTHORIZATION_CODE
    if (grantType === OAuth2GrantType.AUTHORIZATION_CODE && !connection.refresh_token) {
        return false
    }
    // Salesforce doesn't provide an 'expires_in' field, as it is dynamic per organization; therefore, it's necessary for us to establish a low threshold and consistently refresh it.
    const expiresIn = connection.expires_in ?? 60 * 60
    const refreshThreshold = 15 * 60 // Refresh if there is less than 15 minutes to expire
    return (
        secondsSinceEpoch + refreshThreshold >= connection.claimed_at + expiresIn
    )
}



function formatOAuth2Response(response: Omit<BaseOAuth2ConnectionValue, 'claimed_at'>): BaseOAuth2ConnectionValue {
    const secondsSinceEpoch = Math.round(Date.now() / 1000)
    const formattedResponse: BaseOAuth2ConnectionValue = {
        ...response,
        claimed_at: secondsSinceEpoch,
    }

    deleteProps(formattedResponse.data, [
        'access_token',
        'expires_in',
        'refresh_token',
        'scope',
        'token_type',
    ])
    return formattedResponse
}

