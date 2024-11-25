import { SigningKeyId } from '@activepieces/ee-shared'
import { apId, DefaultProjectRole, Principal, PrincipalType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import jwt, { Algorithm, JwtPayload, SignOptions } from 'jsonwebtoken'
import {
    ExternalPrincipal,
    ExternalTokenPayload,
} from '../../src/app/ee/managed-authn/lib/external-token-extractor'

const generateToken = ({
    payload,
    algorithm = 'HS256',
    key = 'secret',
    keyId = '1',
    issuer = 'activepieces',
}: GenerateTokenParams): string => {
    const options: SignOptions = {
        algorithm,
        expiresIn: '1h',
        keyid: keyId,
        issuer,
    }

    return jwt.sign(payload, key, options)
}

export const generateMockToken = async (
    principal?: Partial<Principal>,
): Promise<string> => {
    const mockPrincipal: Principal = {
        id: principal?.id ?? apId(),
        type: principal?.type ?? faker.helpers.enumValue(PrincipalType),
        projectId: principal?.projectId ?? apId(),
        platform: principal?.platform ?? {
            id: apId(),
        },
        tokenVersion: principal?.tokenVersion,
    }

    return generateToken({
        payload: mockPrincipal,
        issuer: 'activepieces',
    })
}

const MOCK_SIGNING_KEY_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`

export const generateMockExternalToken = (
    params?: Partial<GenerateMockExternalTokenParams>,
): GenerateMockExternalTokenReturn => {
    const mockExternalTokenPayload: ExternalTokenPayload = {
        externalUserId: params?.externalUserId ?? apId(),
        role: params?.projectRole as DefaultProjectRole ?? DefaultProjectRole.ADMIN,
        externalProjectId: params?.externalProjectId ?? apId(),
        email: params?.externalEmail ?? faker.internet.email(),
        firstName: params?.externalFirstName ?? faker.person.firstName(),
        pieces: params?.pieces ?? undefined,
        lastName: params?.externalLastName ?? faker.person.lastName(),
    }

    const algorithm = 'RS256'
    const key = params?.privateKey ?? MOCK_SIGNING_KEY_PRIVATE_KEY
    const keyId = params?.signingKeyId ?? apId()

    const mockExternalToken = generateToken({
        payload: mockExternalTokenPayload,
        algorithm,
        key,
        keyId,
    })

    return {
        mockExternalToken,
        mockExternalTokenPayload,
    }
}

export const decodeToken = (token: string): JwtPayload | null => {
    return jwt.decode(token, { json: true })
}

type GenerateTokenParams = {
    payload: Record<string, unknown>
    algorithm?: Algorithm
    key?: string
    keyId?: string
    issuer?: string
}

type GenerateMockExternalTokenParams = ExternalPrincipal & {
    signingKeyId?: SigningKeyId
    privateKey?: string
}

type GenerateMockExternalTokenReturn = {
    mockExternalToken: string
    mockExternalTokenPayload: ExternalTokenPayload
}
