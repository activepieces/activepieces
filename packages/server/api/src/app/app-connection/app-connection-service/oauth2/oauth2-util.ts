import { createHash, randomBytes } from 'crypto'
import { ActivepiecesError, assertNotNullOrUndefined, deleteProps, ErrorCode, isNil, PlatformId, unique } from '@activepieces/core-utils'
import { OAuth2Property, OAuth2Props, PropertyType } from '@activepieces/pieces-framework'
import { AppConnection, AppConnectionType, BaseOAuth2ConnectionValue, GetOAuth2AuthorizationUrlResponse, OAuth2GrantType, resolveValueFromProps } from '@activepieces/shared'
import { isAxiosError } from 'axios'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import { secretManagersService } from '../../../ee/secret-managers/secret-managers.service'
import { pieceMetadataService } from '../../../pieces/metadata/piece-metadata-service'
import { oauth2Discovery } from './oauth2-discovery'

export const oauth2Util = (log: FastifyBaseLogger) => ({
    formatOAuth2Response: (response: Omit<BaseOAuth2ConnectionValue, 'claimed_at'>): BaseOAuth2ConnectionValue => {
        const secondsSinceEpoch = Math.round(Date.now() / 1000)
        const expiresIn = Number(response.expires_in)
        const formattedResponse: BaseOAuth2ConnectionValue = {
            ...response,
            expires_in: Number.isFinite(expiresIn) && expiresIn > 0 ? expiresIn : undefined,
            data: response,
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
    },
    isExpired: (connection: BaseOAuth2ConnectionValue): boolean => {
        const secondsSinceEpoch = Math.round(Date.now() / 1000)
        const grantType = connection.grant_type ?? OAuth2GrantType.AUTHORIZATION_CODE
        if (
            grantType === OAuth2GrantType.AUTHORIZATION_CODE &&
            !connection.refresh_token
        ) {
            return false
        }
        const parsedExpiresIn = Number(connection.expires_in)
        const expiresIn = Number.isFinite(parsedExpiresIn) && parsedExpiresIn > 0 ? parsedExpiresIn : 60 * 60
        const parsedClaimedAt = Number(connection.claimed_at)
        const claimedAt = Number.isFinite(parsedClaimedAt) && parsedClaimedAt > 0 ? parsedClaimedAt : 0
        const refreshThreshold = 15 * 60
        return (
            secondsSinceEpoch + refreshThreshold >= claimedAt + expiresIn
        )
    },
    isUserError: (e: unknown): boolean => {
        if (isAxiosError(e)) {
            const error = e.response?.data.error
            switch (error) {
                case 'invalid_grant':
                    return true
                case 'invalid_request':
                case 'invalid_client':
                case 'invalid_scope':
                case 'unauthorized_client':
                case 'unsupported_grant_type':
                default:
                    return false
            }
        }
        return false
    },
    getOAuth2TokenUrl: async ({
        platformId,
        pieceName,
        pieceVersion,
        props,
    }: OAuth2TokenUrlParams): Promise<string> => {
        const pieceMetadata = await pieceMetadataService(log).getOrThrow({
            name: pieceName,
            platformId,
            version: pieceVersion,
        })
        const pieceAuth = Array.isArray(pieceMetadata.auth) ? pieceMetadata.auth.find(auth => auth.type === PropertyType.OAUTH2) : pieceMetadata.auth
        assertNotNullOrUndefined(pieceAuth, 'auth')
        switch (pieceAuth.type) {
            case PropertyType.OAUTH2: {
                const templateProps = backfillOptionalProps(props, pieceAuth.props)
                assertPlaceholdersResolved({
                    templates: [pieceAuth.tokenUrl, ...pieceAuth.scope],
                    props: templateProps,
                    authProps: pieceAuth.props,
                })
                return resolveValueFromProps(templateProps, pieceAuth.tokenUrl)
            }
            default:
                throw new ActivepiecesError({
                    code: ErrorCode.INVALID_APP_CONNECTION,
                    params: {
                        error: 'invalid auth type',
                    },
                })
        }
    },
    buildAuthorizationUrl: async ({
        platformId,
        pieceName,
        pieceVersion,
        clientId,
        redirectUrl,
        projectId,
        props,
        scopes,
    }: BuildAuthorizationUrlParams): Promise<GetOAuth2AuthorizationUrlResponse> => {
        const pieceMetadata = await pieceMetadataService(log).getOrThrow({
            name: pieceName,
            platformId,
            version: pieceVersion,
        })
        const pieceAuth = Array.isArray(pieceMetadata.auth)
            ? pieceMetadata.auth.find(auth => auth.type === PropertyType.OAUTH2)
            : pieceMetadata.auth
        assertNotNullOrUndefined(pieceAuth, 'auth')
        if (pieceAuth.type !== PropertyType.OAUTH2) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_APP_CONNECTION,
                params: { error: 'invalid auth type' },
            })
        }

        const discovered = await discoverOAuth2Client({ pieceAuth, props, redirectUrl })
        const resolvedProps = isNil(discovered) ? props : { ...props, ...discovered.props }
        const resolvedClientId = isNil(discovered)
            ? await secretManagersService(log).resolveString({
                key: clientId,
                platformId,
                throwOnFailure: true,
                projectIds: projectId ? [projectId] : undefined,
            })
            : discovered.client_id
        const selectedScopes = resolveSelectedScopes(scopes, pieceAuth.scope)
        const templateProps = backfillOptionalProps(resolvedProps, pieceAuth.props)
        assertPlaceholdersResolved({
            templates: [pieceAuth.authUrl, ...selectedScopes],
            props: templateProps,
            authProps: pieceAuth.props,
        })
        const authUrl = resolveValueFromProps(templateProps, pieceAuth.authUrl)
        const scope = resolveValueFromProps(templateProps, selectedScopes.join(' '))

        const queryParams: Record<string, string> = {
            response_type: 'code',
            client_id: resolvedClientId,
            redirect_uri: redirectUrl,
            access_type: 'offline',
            state: nanoid(),
            prompt: 'consent',
            scope,
            ...(pieceAuth.extra ?? {}),
        }

        const prompt = pieceAuth.prompt
        if (prompt === 'omit') {
            delete queryParams['prompt']
        }
        else if (prompt !== undefined && prompt !== null) {
            queryParams['prompt'] = prompt
        }

        let codeVerifier: string | undefined
        if (pieceAuth.pkce) {
            codeVerifier = randomBytes(32).toString('base64url').slice(0, 43)
            const method = pieceAuth.pkceMethod ?? 'plain'
            queryParams['code_challenge_method'] = method
            if (method === 'S256') {
                const hash = createHash('sha256').update(codeVerifier).digest()
                queryParams['code_challenge'] = Buffer.from(hash).toString('base64url')
            }
            else {
                queryParams['code_challenge'] = codeVerifier
            }
        }

        const url = new URL(authUrl)
        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== '') {
                url.searchParams.append(key, value)
            }
        })

        return {
            authorizationUrl: url.toString(),
            codeVerifier,
            ...(isNil(discovered) ? {} : { discovered }),
        }
    },
    removeRefreshTokenAndClientSecret: (connection: AppConnection): AppConnection => {
        if (connection.value.type === AppConnectionType.OAUTH2 && connection.value.grant_type === OAuth2GrantType.CLIENT_CREDENTIALS) {
            connection.value.client_secret = '(REDACTED)'
        }
        if (connection.value.type === AppConnectionType.OAUTH2
            || connection.value.type === AppConnectionType.CLOUD_OAUTH2
            || connection.value.type === AppConnectionType.PLATFORM_OAUTH2) {
            connection.value = {
                ...connection.value,
                refresh_token: '(REDACTED)',
            }
        }
        return connection
    },
})

type OAuth2TokenUrlParams = {
    platformId: PlatformId
    pieceName: string
    pieceVersion?: string
    props?: Record<string, unknown>
}

const resolveSelectedScopes = (requested: string[] | undefined, allowed: string[]): string[] => {
    if (requested === undefined) {
        return allowed
    }
    const allowedSet = new Set(allowed)
    const invalid = requested.filter(scope => !allowedSet.has(scope))
    if (invalid.length > 0) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_APP_CONNECTION,
            params: { error: `requested scopes are not declared by the piece: ${invalid.join(', ')}` },
        })
    }
    if (requested.length === 0) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_APP_CONNECTION,
            params: { error: 'at least one scope must be selected' },
        })
    }
    return requested
}

const discoverOAuth2Client = async ({ pieceAuth, props, redirectUrl }: DiscoverOAuth2ClientParams): Promise<DiscoveredOAuth2Props | undefined> => {
    const discovery = pieceAuth.discovery
    if (isNil(discovery)) {
        return undefined
    }
    const alreadyFilledIn = String(props?.[discovery.authUrlProp] ?? '').trim() !== ''
    if (alreadyFilledIn) {
        return undefined
    }
    const serverUrl = props?.[discovery.serverUrlProp]
    if (typeof serverUrl !== 'string' || serverUrl.trim() === '') {
        const label = pieceAuth.props?.[discovery.serverUrlProp]?.displayName ?? discovery.serverUrlProp
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_APP_CONNECTION,
            params: { error: `missing required connection settings: ${label}` },
        })
    }
    const client = await oauth2Discovery.discoverAndRegister({ serverUrl, redirectUrl })
    return {
        props: {
            [discovery.authUrlProp]: client.authUrl,
            [discovery.tokenUrlProp]: client.tokenUrl,
            ...(isNil(discovery.scopesProp) ? {} : { [discovery.scopesProp]: client.scopes }),
        },
        client_id: client.clientId,
        client_secret: client.clientSecret,
    }
}

// `resolveValueFromProps` only substitutes a `{key}` placeholder when `key` is present in
// `props`; an optional prop the caller never supplied is absent, not empty, and would
// otherwise leak through as the literal `{key}` text (e.g. a bare `scope={scopes}`).
const backfillOptionalProps = (props: Record<string, unknown> | undefined, authProps: OAuth2Props | undefined): Record<string, unknown> => {
    const declaredProps = authProps ?? {}
    const backfilled = { ...(props ?? {}) }
    Object.entries(declaredProps).forEach(([key, prop]) => {
        if (prop.required === false && isNil(backfilled[key])) {
            backfilled[key] = ''
        }
    })
    return backfilled
}

const assertPlaceholdersResolved = ({ templates, props, authProps }: AssertPlaceholdersResolvedParams): void => {
    const declaredProps = authProps ?? {}
    const missing = unique(
        templates
            .flatMap(template => [...template.matchAll(/\{([A-Za-z0-9_]+)\}/g)])
            .map(match => match[1])
            .filter(key => !isNil(declaredProps[key]))
            .filter(key => declaredProps[key].required !== false)
            .filter(key => {
                const value = props?.[key]
                return isNil(value) || String(value).trim() === ''
            }),
    )
    if (missing.length === 0) {
        return
    }
    const labels = missing.map(key => declaredProps[key].displayName).join(', ')
    throw new ActivepiecesError({
        code: ErrorCode.INVALID_APP_CONNECTION,
        params: { error: `missing required connection settings: ${labels}` },
    })
}

type AssertPlaceholdersResolvedParams = {
    templates: string[]
    props: Record<string, unknown> | undefined
    authProps: OAuth2Props | undefined
}

type DiscoverOAuth2ClientParams = {
    pieceAuth: OAuth2Property<OAuth2Props>
    props: Record<string, unknown> | undefined
    redirectUrl: string
}

type DiscoveredOAuth2Props = NonNullable<GetOAuth2AuthorizationUrlResponse['discovered']>

type BuildAuthorizationUrlParams = {
    platformId: PlatformId
    pieceName: string
    pieceVersion?: string
    clientId: string
    redirectUrl: string
    props?: Record<string, unknown>
    projectId?: string
    scopes?: string[]
}
