# Custom OIDC Provider Implementation Guide

This document outlines the changes required to add support for custom OIDC (OpenID Connect) authentication providers to Activepieces.

## Overview

Currently, Activepieces supports:
- Google OAuth (hardcoded)
- GitHub OAuth
- SAML authentication

This guide describes how to add support for **generic OIDC providers** (e.g., Keycloak, Auth0, Okta, Azure AD, etc.).

## Architecture Overview

The federated authentication system has three main components:

1. **Shared Types** (`packages/shared/`) - Type definitions used by both frontend and backend
2. **Backend Services** (`packages/server/api/src/app/ee/authentication/`) - Authentication logic
3. **Frontend** (`packages/react-ui/`) - UI components and API calls

## Required Changes

### 1. Shared Types

#### File: `packages/shared/src/lib/federated-authn/authn-provider-name.ts`

**Current:**
```typescript
export enum ThirdPartyAuthnProviderEnum {
    GOOGLE = 'google',
    SAML = 'saml',
}
```

**Add:**
```typescript
export enum ThirdPartyAuthnProviderEnum {
    GOOGLE = 'google',
    SAML = 'saml',
    OIDC = 'oidc',  // NEW
}
```

#### File: `packages/shared/src/lib/federated-authn/index.ts`

**Add OIDC configuration type:**
```typescript
export const OidcAuthnProviderConfig = Type.Object({
    clientId: Type.String(),
    clientSecret: Type.String(),
    issuer: Type.String(),  // OIDC provider's issuer URL (e.g., https://keycloak.example.com/realms/myrealm)
    scope: Type.Optional(Type.String()),  // Optional, defaults to 'openid profile email'
    authorizationEndpoint: Type.Optional(Type.String()),  // Optional, discovered automatically
    tokenEndpoint: Type.Optional(Type.String()),  // Optional, discovered automatically
    userinfoEndpoint: Type.Optional(Type.String()),  // Optional, discovered automatically
    jwksUri: Type.Optional(Type.String()),  // Optional, discovered automatically
})
export type OidcAuthnProviderConfig = Static<typeof OidcAuthnProviderConfig>
```

**Update FederatedAuthnProviderConfig:**
```typescript
export const FederatedAuthnProviderConfig = Type.Object({
    google: Nullable(GoogleAuthnProviderConfig),
    github: Nullable(GithubAuthnProviderConfig),
    saml: Nullable(SAMLAuthnProviderConfig),
    oidc: Nullable(OidcAuthnProviderConfig),  // ADD THIS
})

export const FederatedAuthnProviderConfigWithoutSensitiveData = Type.Object({
    google: Nullable(Type.Pick(GoogleAuthnProviderConfig, ['clientId'])),
    github: Nullable(Type.Pick(GithubAuthnProviderConfig, ['clientId'])),
    saml: Nullable(Type.Object({})),
    oidc: Nullable(Type.Pick(OidcAuthnProviderConfig, ['clientId', 'issuer'])),  // ADD THIS
})
```

### 2. Backend Implementation

#### File: `packages/server/api/src/app/ee/authentication/federated-authn/oidc-authn-provider.ts` (NEW)

Create a new file implementing OIDC authentication flow:

```typescript
import { assertNotNullOrUndefined, OidcAuthnProviderConfig } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import jwksClient from 'jwks-rsa'
import { JwtSignAlgorithm, jwtUtils } from '../../../helper/jwt-utils'
import { federatedAuthnService } from './federated-authn-service'

export const oidcAuthnProvider = (log: FastifyBaseLogger) => ({
    async getLoginUrl(params: GetLoginUrlParams): Promise<string> {
        const { config, platformId } = params
        
        // Perform OIDC discovery if endpoints not provided
        const endpoints = await discoverOidcEndpoints(config)
        
        const loginUrl = new URL(endpoints.authorizationEndpoint)
        loginUrl.searchParams.set('client_id', config.clientId)
        loginUrl.searchParams.set(
            'redirect_uri',
            await federatedAuthnService(log).getThirdPartyRedirectUrl(platformId),
        )
        loginUrl.searchParams.set('scope', config.scope || 'openid profile email')
        loginUrl.searchParams.set('response_type', 'code')
        loginUrl.searchParams.set('state', generateState()) // CSRF protection

        return loginUrl.href
    },

    async authenticate(params: AuthenticateParams): Promise<FederatedAuthnIdToken> {
        const { config, authorizationCode, platformId } = params
        
        // Perform OIDC discovery
        const endpoints = await discoverOidcEndpoints(config)
        
        // Exchange code for tokens
        const idToken = await exchangeCodeForIdToken(
            log,
            platformId,
            config,
            endpoints,
            authorizationCode,
        )
        
        // Verify and decode ID token
        return verifyIdToken(config, endpoints, idToken)
    },
})

async function discoverOidcEndpoints(config: OidcAuthnProviderConfig): Promise<OidcEndpoints> {
    // If all endpoints provided, use them
    if (config.authorizationEndpoint && config.tokenEndpoint && config.jwksUri) {
        return {
            authorizationEndpoint: config.authorizationEndpoint,
            tokenEndpoint: config.tokenEndpoint,
            userinfoEndpoint: config.userinfoEndpoint,
            jwksUri: config.jwksUri,
        }
    }
    
    // Otherwise, discover via .well-known/openid-configuration
    const discoveryUrl = `${config.issuer.replace(/\/$/, '')}/.well-known/openid-configuration`
    const response = await fetch(discoveryUrl)
    const discovery = await response.json()
    
    return {
        authorizationEndpoint: discovery.authorization_endpoint,
        tokenEndpoint: discovery.token_endpoint,
        userinfoEndpoint: discovery.userinfo_endpoint,
        jwksUri: discovery.jwks_uri,
    }
}

async function exchangeCodeForIdToken(
    log: FastifyBaseLogger,
    platformId: string | undefined,
    config: OidcAuthnProviderConfig,
    endpoints: OidcEndpoints,
    code: string,
): Promise<string> {
    const response = await fetch(endpoints.tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            code,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: await federatedAuthnService(log).getThirdPartyRedirectUrl(platformId),
            grant_type: 'authorization_code',
        }),
    })

    const tokens = await response.json()
    return tokens.id_token
}

async function verifyIdToken(
    config: OidcAuthnProviderConfig,
    endpoints: OidcEndpoints,
    idToken: string,
): Promise<FederatedAuthnIdToken> {
    const { header } = jwtUtils.decode({ jwt: idToken })
    
    // Create JWKS client for this provider
    const keyLoader = jwksClient({
        rateLimit: true,
        cache: true,
        jwksUri: endpoints.jwksUri,
    })
    
    const signingKey = await keyLoader.getSigningKey(header.kid)
    const publicKey = signingKey.getPublicKey()

    const payload = await jwtUtils.decodeAndVerify<OidcIdTokenPayload>({
        jwt: idToken,
        key: publicKey,
        issuer: config.issuer,
        algorithm: JwtSignAlgorithm.RS256,
        audience: config.clientId,
    })

    return {
        email: payload.email,
        firstName: payload.given_name || payload.name?.split(' ')[0] || 'User',
        lastName: payload.family_name || payload.name?.split(' ').slice(1).join(' ') || '',
        imageUrl: payload.picture,
    }
}

function generateState(): string {
    return crypto.randomBytes(32).toString('hex')
}

type GetLoginUrlParams = {
    config: OidcAuthnProviderConfig
    platformId: string | undefined
}

type AuthenticateParams = {
    config: OidcAuthnProviderConfig
    authorizationCode: string
    platformId: string | undefined
}

type OidcEndpoints = {
    authorizationEndpoint: string
    tokenEndpoint: string
    userinfoEndpoint?: string
    jwksUri: string
}

type OidcIdTokenPayload = {
    email: string
    given_name?: string
    family_name?: string
    name?: string
    picture?: string
    sub: string
}

type FederatedAuthnIdToken = {
    email: string
    firstName: string
    lastName: string
    imageUrl?: string
}
```

#### File: `packages/server/api/src/app/ee/authentication/federated-authn/federated-authn-service.ts`

**Current implementation is hardcoded to Google. Need to refactor:**

```typescript
import { AppSystemProp } from '@activepieces/server-shared'
import {
    assertNotNullOrUndefined,
    AuthenticationResponse,
    FederatedAuthnLoginResponse,
    isNil,
    ThirdPartyAuthnProviderEnum,
    UserIdentityProvider,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { authenticationService } from '../../../authentication/authentication.service'
import { system } from '../../../helper/system/system'
import { platformService } from '../../../platform/platform.service'
import { domainHelper } from '../../custom-domains/domain-helper'
import { googleAuthnProvider } from './google-authn-provider'
import { oidcAuthnProvider } from './oidc-authn-provider'  // ADD THIS

export const federatedAuthnService = (log: FastifyBaseLogger) => ({
    async login({
        platformId,
        providerName,  // ADD THIS PARAMETER
    }: LoginParams): Promise<FederatedAuthnLoginResponse> {
        // Route to appropriate provider
        switch (providerName) {
            case ThirdPartyAuthnProviderEnum.GOOGLE: {
                const { clientId } = await getGoogleClientIdAndSecret(platformId)
                const loginUrl = await googleAuthnProvider(log).getLoginUrl({
                    clientId,
                    platformId,
                })
                return { loginUrl }
            }
            case ThirdPartyAuthnProviderEnum.OIDC: {
                const config = await getOidcConfig(platformId)
                const loginUrl = await oidcAuthnProvider(log).getLoginUrl({
                    config,
                    platformId,
                })
                return { loginUrl }
            }
            default:
                throw new Error(`Unsupported provider: ${providerName}`)
        }
    },

    async claim({
        platformId,
        code,
        providerName,  // ADD THIS PARAMETER
    }: ClaimParams): Promise<AuthenticationResponse> {
        let idToken
        let provider: UserIdentityProvider
        
        switch (providerName) {
            case ThirdPartyAuthnProviderEnum.GOOGLE: {
                const { clientId, clientSecret } = await getGoogleClientIdAndSecret(platformId)
                idToken = await googleAuthnProvider(log).authenticate({
                    clientId,
                    clientSecret,
                    authorizationCode: code,
                    platformId,
                })
                provider = UserIdentityProvider.GOOGLE
                break
            }
            case ThirdPartyAuthnProviderEnum.OIDC: {
                const config = await getOidcConfig(platformId)
                idToken = await oidcAuthnProvider(log).authenticate({
                    config,
                    authorizationCode: code,
                    platformId,
                })
                provider = UserIdentityProvider.OIDC  // ADD THIS TO UserIdentityProvider enum
                break
            }
            default:
                throw new Error(`Unsupported provider: ${providerName}`)
        }

        return authenticationService(log).federatedAuthn({
            email: idToken.email,
            firstName: idToken.firstName,
            lastName: idToken.lastName,
            trackEvents: true,
            newsLetter: true,
            provider,
            predefinedPlatformId: platformId ?? null,
            imageUrl: idToken.imageUrl,
        })
    },
    
    async getThirdPartyRedirectUrl(platformId: string | undefined): Promise<string> {
        return domainHelper.getInternalUrl({
            path: '/redirect',
            platformId,
        })
    },
})

async function getGoogleClientIdAndSecret(platformId: string | undefined) {
    if (isNil(platformId)) {
        return {
            clientId: system.getOrThrow(AppSystemProp.GOOGLE_CLIENT_ID),
            clientSecret: system.getOrThrow(AppSystemProp.GOOGLE_CLIENT_SECRET),
        }
    }
    const platform = await platformService.getOneOrThrow(platformId)
    const clientInformation = platform.federatedAuthProviders.google
    assertNotNullOrUndefined(clientInformation, 'Google client information is not defined')
    return {
        clientId: clientInformation.clientId,
        clientSecret: clientInformation.clientSecret,
    }
}

async function getOidcConfig(platformId: string | undefined) {
    assertNotNullOrUndefined(platformId, 'Platform ID is required for OIDC authentication')
    const platform = await platformService.getOneOrThrow(platformId)
    const config = platform.federatedAuthProviders.oidc
    assertNotNullOrUndefined(config, 'OIDC configuration is not defined for this platform')
    return config
}

type LoginParams = {
    platformId: string | undefined
    providerName: ThirdPartyAuthnProviderEnum  // ADD THIS
}

type ClaimParams = {
    platformId: string | undefined
    code: string
    providerName: ThirdPartyAuthnProviderEnum  // ADD THIS
}
```

#### File: `packages/server/api/src/app/ee/authentication/federated-authn/federated-authn-module.ts`

**Update to pass provider name:**

```typescript
const federatedAuthnController: FastifyPluginAsyncTypebox = async (app) => {
    app.get('/login', LoginRequestSchema, async (req) => {
        const platformId = await platformUtils.getPlatformIdForRequest(req)
        return federatedAuthnService(req.log).login({
            platformId: platformId ?? undefined,
            providerName: req.query.providerName,  // ADD THIS
        })
    })

    app.post('/claim', ClaimTokenRequestSchema, async (req) => {
        const platformId = await platformUtils.getPlatformIdForRequest(req)
        const response = await federatedAuthnService(req.log).claim({
            platformId: platformId ?? undefined,
            code: req.body.code,
            providerName: req.body.providerName,  // ADD THIS
        })
        // ... rest of the code
    })
}
```

### 3. Add OIDC to UserIdentityProvider Enum

#### File: `packages/shared/src/lib/user/user.ts` (or wherever UserIdentityProvider is defined)

```typescript
export enum UserIdentityProvider {
    EMAIL = 'EMAIL',
    GOOGLE = 'GOOGLE',
    GITHUB = 'GITHUB',
    SAML = 'SAML',
    OIDC = 'OIDC',  // ADD THIS
}
```

### 4. Frontend Changes

#### File: `packages/react-ui/src/lib/authentication-api.ts`

**Update to support OIDC:**
```typescript
getFederatedAuthLoginUrl(providerName: ThirdPartyAuthnProviderEnum) {
    return this.get<FederatedAuthnLoginResponse>(
        `/v1/authn/federated/login?providerName=${providerName}`,
    )
}
```

#### Update Login Components

Add OIDC login button alongside Google/SAML buttons when OIDC is configured for the platform.

## Testing

### Local Development Testing

1. Set up a local OIDC provider (e.g., Keycloak):
   ```bash
   docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin \
     quay.io/keycloak/keycloak:latest start-dev
   ```

2. Configure a realm and client in Keycloak

3. Update platform configuration with OIDC settings:
   ```json
   {
     "federatedAuthProviders": {
       "oidc": {
         "clientId": "activepieces",
         "clientSecret": "your-secret",
         "issuer": "http://localhost:8080/realms/myrealm"
       }
     }
   }
   ```

4. Test the login flow

## Security Considerations

1. **State Parameter**: Implement CSRF protection using state parameter
2. **Token Validation**: Always validate ID tokens using JWKS
3. **Issuer Validation**: Verify the token issuer matches the configuration
4. **Audience Validation**: Verify the token audience matches the client ID
5. **HTTPS**: OIDC discovery and endpoints should use HTTPS in production
6. **Token Expiration**: Validate token expiration claims
7. **Nonce**: Consider adding nonce parameter for additional security

## Migration Notes

- Existing Google authentication will continue to work
- OIDC is opt-in per platform
- No database migrations required (federatedAuthProviders field already supports arbitrary JSON)

## References

- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)
- [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)
- Current implementation: `packages/server/api/src/app/ee/authentication/federated-authn/google-authn-provider.ts`
- SAML implementation: `packages/server/api/src/app/ee/authentication/saml-authn/`

## Implementation Checklist

- [ ] Add OIDC to ThirdPartyAuthnProviderEnum
- [ ] Create OidcAuthnProviderConfig type
- [ ] Update FederatedAuthnProviderConfig to include OIDC
- [ ] Create oidc-authn-provider.ts with OIDC discovery and authentication
- [ ] Refactor federated-authn-service.ts to support multiple providers
- [ ] Update federated-authn-module.ts to accept provider name
- [ ] Add OIDC to UserIdentityProvider enum
- [ ] Update frontend authentication API
- [ ] Add OIDC login button to frontend
- [ ] Add platform configuration UI for OIDC settings
- [ ] Write tests for OIDC flow
- [ ] Update documentation
