import { RouteSecurity } from "@activepieces/server-shared"
import { ActivepiecesError, ErrorCode, Principal, PrincipalType } from "@activepieces/shared"

import { ApiKey } from "@activepieces/ee-shared"

export const authenticateOrThrow = async (rawToken: string | null, route: RouteSecurity): Promise<Principal> => {
   /* if (isApiKey(rawToken)) {
        return await apiKeyAuthn.authenticateOrThrow(token)
    }
    if (isBearerToken(rawToken)) {
        return await bearerTokenAuthn.authenticateOrThrow(token)
    }
    throw new ActivepiecesError({
        code: ErrorCode.AUTHENTICATION,
        params: {
            message: 'invalid authentication',
        },
    })*/
}


function createPrincipalForApiKey(apiKey: ApiKey): Principal {
    return {
        id: apiKey.id,
        type: PrincipalType.API_KEY,
    }
}

function createPrincialForBearer(token: string): Principal {

}

function isApiKey(jwtToken: string): boolean {
    return jwtToken.startsWith('Bearer sk-')
}

function isBearerToken(jwtToken: string): boolean {
    return jwtToken.startsWith('Bearer ')
}