import {
    ClaimOAuth2Request,
    OAuth2Service,
    RefreshOAuth2Request,
} from './oauth2-service'
import { cloudOAuth2Service } from './services/cloud-oauth2-service'
import { credentialsOauth2Service } from './services/credentials-oauth2-service'
import {
    AppConnectionType,
    PlatformOAuth2ConnectionValue,
} from '@activepieces/shared'

const unimplementedService: OAuth2Service<PlatformOAuth2ConnectionValue> = {
    claim: async (
        _req: ClaimOAuth2Request,
    ): Promise<PlatformOAuth2ConnectionValue> => {
        throw new Error('Unimplemented platform oauth')
    },
    refresh: async (
        _req: RefreshOAuth2Request<PlatformOAuth2ConnectionValue>,
    ): Promise<PlatformOAuth2ConnectionValue> => {
        throw new Error('Unimplemented platform oauth')
    },
}

export const oauth2Handler = {
    [AppConnectionType.CLOUD_OAUTH2]: cloudOAuth2Service,
    [AppConnectionType.OAUTH2]: credentialsOauth2Service,
    [AppConnectionType.PLATFORM_OAUTH2]: unimplementedService,
}

export function setPlatformOAuthService({
    service,
}: {
    service: OAuth2Service<PlatformOAuth2ConnectionValue>
}) {
    oauth2Handler[AppConnectionType.PLATFORM_OAUTH2] = service
}
