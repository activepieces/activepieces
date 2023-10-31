import { KeyAlgorithm, SigningKey, Platform, SigningKeyId } from '@activepieces/ee-shared'
import { UserStatus, User, apId, Project, NotificationStatus, ProjectType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import jwt, { SignOptions } from 'jsonwebtoken'
import { ExternalPrincipal } from '../../src/app/ee/managed-authn/lib/external-token-extractor'

export const createMockUser = (user?: Partial<User>): User => {
    return {
        id: user?.id ?? apId(),
        created: user?.created ?? faker.date.recent().toISOString(),
        updated: user?.updated ?? faker.date.recent().toISOString(),
        email: user?.email ?? faker.internet.email(),
        firstName: user?.firstName ?? faker.person.firstName(),
        lastName: user?.lastName ?? faker.person.lastName(),
        trackEvents: user?.trackEvents ?? faker.datatype.boolean(),
        newsLetter: user?.newsLetter ?? faker.datatype.boolean(),
        password: user?.password ?? faker.internet.password(),
        status: user?.status ?? faker.helpers.enumValue(UserStatus),
        imageUrl: user?.imageUrl ?? faker.image.urlPlaceholder(),
        title: user?.title ?? faker.lorem.sentence(),
    }
}

export const createMockProject = (project?: Partial<Project>): Project => {
    return {
        id: project?.id ?? apId(),
        created: project?.created ?? faker.date.recent().toISOString(),
        updated: project?.updated ?? faker.date.recent().toISOString(),
        ownerId: project?.ownerId ?? apId(),
        displayName: project?.ownerId ?? faker.lorem.word(),
        notifyStatus: project?.notifyStatus ?? faker.helpers.enumValue(NotificationStatus),
        type: project?.type ?? faker.helpers.enumValue(ProjectType),
        platformId: project?.id ?? apId(),
    }
}

export const createMockPlatform = (platform?: Partial<Platform>): Platform => {
    return {
        id: platform?.id ?? apId(),
        created: platform?.created ?? faker.date.recent().toISOString(),
        updated: platform?.updated ?? faker.date.recent().toISOString(),
        ownerId: platform?.ownerId ?? apId(),
        name: platform?.name ?? faker.lorem.word(),
        primaryColor: platform?.primaryColor ??  faker.color.rgb(),
        logoIconUrl: platform?.logoIconUrl ?? faker.image.urlPlaceholder(),
        fullLogoUrl: platform?.fullLogoUrl ?? faker.image.urlPlaceholder(),
        favIconUrl: platform?.favIconUrl ?? faker.image.urlPlaceholder(),
    }
}

const MOCK_SIGNING_KEY_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`

const MOCK_SIGNING_KEY_PUBLIC_KEY = `-----BEGIN RSA PUBLIC KEY-----
MIICCgKCAgEAlnd5vGP/1bzcndN/yRD+ZTd6tuemxaJd+12bOZ2QCXcTM03AKSp3
NE5QMyIi13PXMg+z1uPowfivPJ4iVTMaW1U00O7JlUduGR0VrG0BCJlfEf852V71
TfE+2+EpMme9Yw6Gs/YAuOwgVwu3n/XF0il3FTIm1oY1a/MA79rv0RSscnIgCaYJ
e86LWm+H6753Si0MIId/ajIfYYIndN6qRIlPsgagdL+kljUSPEiIzmV0POxTltBo
tXL1t7Mu+meJrY85MXG5W8BS05+q6dJql7Cl0UbPK152ziakB+biMI/4hYlaOIBT
3KeOcz/Jg7Zv21Y0tbdrZ5osVrrNpFsCV7PGyQIUDVmmnCHrOEBS2XM5zOHzTxMl
JQh3Db318rB5415zuBTzrO+20++03kH4SwZEEBg1SDAInYwLOWldbTuZuD0Hx7P2
g4a3OqHHVOcAgtsHgmU7/zCgCIETg4KbRdpSsqOm/YJDWWoLDTwvKnH5QHSBacq1
kxbNAUSuLQESkfZq1Dw5+tdBDJr29bxjmiSggyittTYn1B3iHACNoe4zj9sMQQIf
j9mmntXsa/leIwBVspiEOHYZwJOe5+goSd8K1VIQJxC1DVBxB2eHxMvuo3eyJ0HE
DlebIeZy4zrE1LPgRic1kfdemyxvuN3iwZnPGiY79nL1ZNDM3M4ApSMCAwEAAQ==
-----END RSA PUBLIC KEY-----`

export const createMockSigningKey = (signingKey?: Partial<SigningKey>): SigningKey => {
    return {
        id: signingKey?.id ?? apId(),
        created: signingKey?.created ?? faker.date.recent().toISOString(),
        updated: signingKey?.updated ?? faker.date.recent().toISOString(),
        displayName: signingKey?.displayName ?? faker.lorem.word(),
        platformId: signingKey?.platformId ?? apId(),
        publicKey: signingKey?.publicKey ?? MOCK_SIGNING_KEY_PUBLIC_KEY,
        generatedBy: signingKey?.generatedBy ??  apId(),
        algorithm: signingKey?.algorithm ?? KeyAlgorithm.RSA,
    }
}

type CreateMockExternalTokenParams = ExternalPrincipal & {
    signingKeyId?: SigningKeyId
    privateKey?: string
}

export const generateMockExternalToken = (params?: Partial<CreateMockExternalTokenParams>): string => {
    const payload = {
        sub: params?.externalUserId ?? apId(),
        platformId: params?.platformId ?? apId(),
        projectId: params?.externalProjectId ?? apId(),
        email: params?.externalEmail ?? faker.internet.email(),
        firstName: params?.externalFirstName ?? faker.person.firstName(),
        lastName: params?.externalLastName ?? faker.person.lastName(),
    }

    const key = params?.privateKey ?? MOCK_SIGNING_KEY_PRIVATE_KEY

    const options: SignOptions = {
        algorithm: 'RS256',
        expiresIn: '1h',
        keyid: params?.signingKeyId ?? apId(),
    }

    return jwt.sign(
        payload,
        key,
        options,
    )
}
