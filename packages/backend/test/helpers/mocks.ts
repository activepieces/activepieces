import { KeyAlgorithm, SigningKey, Platform, OAuthApp, FilteredPieceBehavior } from '@activepieces/ee-shared'
import { UserStatus, User, apId, Project, NotificationStatus, ProjectType, PieceType, PackageType } from '@activepieces/shared'
import { OAuthAppWithEncryptedSecret } from '../../src/app/ee/oauth-apps/oauth-app.entity'
import { encryptString } from '../../src/app/helper/encryption'
import { faker } from '@faker-js/faker'
import { PieceMetadataSchema } from '../../src/app/pieces/piece-metadata-entity'

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
        externalId: user?.externalId ?? apId(),
    }
}

export const createMockOAuthApp = (oAuthApp?: Partial<OAuthApp>): OAuthAppWithEncryptedSecret => {
    return {
        id: oAuthApp?.id ?? apId(),
        created: oAuthApp?.created ?? faker.date.recent().toISOString(),
        updated: oAuthApp?.updated ?? faker.date.recent().toISOString(),
        platformId: oAuthApp?.platformId ?? apId(),
        pieceName: oAuthApp?.pieceName ?? faker.lorem.word(),
        clientId: oAuthApp?.clientId ?? apId(),
        clientSecret: encryptString(faker.lorem.word()),
    }
}

export const createMockProject = (project?: Partial<Project>): Project => {
    return {
        id: project?.id ?? apId(),
        created: project?.created ?? faker.date.recent().toISOString(),
        updated: project?.updated ?? faker.date.recent().toISOString(),
        ownerId: project?.ownerId ?? apId(),
        displayName: project?.displayName ?? faker.lorem.word(),
        notifyStatus: project?.notifyStatus ?? faker.helpers.enumValue(NotificationStatus),
        type: project?.type ?? faker.helpers.enumValue(ProjectType),
        platformId: project?.platformId ?? apId(),
        externalId: project?.externalId ?? apId(),
    }
}

export const createMockPlatform = (platform?: Partial<Platform>): Platform => {
    return {
        id: platform?.id ?? apId(),
        created: platform?.created ?? faker.date.recent().toISOString(),
        updated: platform?.updated ?? faker.date.recent().toISOString(),
        ownerId: platform?.ownerId ?? apId(),
        name: platform?.name ?? faker.lorem.word(),
        primaryColor: platform?.primaryColor ?? faker.color.rgb(),
        logoIconUrl: platform?.logoIconUrl ?? faker.image.urlPlaceholder(),
        fullLogoUrl: platform?.fullLogoUrl ?? faker.image.urlPlaceholder(),
        favIconUrl: platform?.favIconUrl ?? faker.image.urlPlaceholder(),
        filteredPieceNames: platform?.filteredPieceNames ?? [],
        filteredPieceBehavior: platform?.filteredPieceBehavior ?? faker.helpers.enumValue(FilteredPieceBehavior),
        smtpHost: platform?.smtpHost ?? faker.internet.domainName(),
        smtpPort: platform?.smtpPort ?? faker.datatype.number(),
        smtpUser: platform?.smtpUser ?? faker.internet.userName(),
        smtpPassword: platform?.smtpPassword ?? faker.internet.password(),
        smtpUseSSL: platform?.smtpUseSSL ?? faker.datatype.boolean(),
        smtpSenderEmail: platform?.smtpSenderEmail ?? faker.internet.email(),
        privacyPolicyUrl: platform?.privacyPolicyUrl ?? faker.internet.url(),
        termsOfServiceUrl: platform?.termsOfServiceUrl ?? faker.internet.url(),
        cloudAuthEnabled: platform?.cloudAuthEnabled ?? faker.datatype.boolean(),
        showPoweredBy: platform?.showPoweredBy ?? faker.datatype.boolean(),
    }
}

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
        generatedBy: signingKey?.generatedBy ?? apId(),
        algorithm: signingKey?.algorithm ?? KeyAlgorithm.RSA,
    }
}

export const createMockPieceMetadata = (pieceMetadata?: Partial<Omit<PieceMetadataSchema, 'project'>>): Omit<PieceMetadataSchema, 'project'> => {
    return {
        id: pieceMetadata?.id ?? apId(),
        created: pieceMetadata?.created ?? faker.date.recent().toISOString(),
        updated: pieceMetadata?.updated ?? faker.date.recent().toISOString(),
        name: pieceMetadata?.name ?? faker.lorem.word(),
        displayName: pieceMetadata?.displayName ?? faker.lorem.word(),
        logoUrl: pieceMetadata?.logoUrl ?? faker.image.urlPlaceholder(),
        description: pieceMetadata?.description ?? faker.lorem.sentence(),
        projectId: pieceMetadata?.projectId,
        directoryName: pieceMetadata?.directoryName,
        auth: pieceMetadata?.auth,
        version: pieceMetadata?.version ?? faker.system.semver(),
        minimumSupportedRelease: pieceMetadata?.minimumSupportedRelease ?? '0.0.0',
        maximumSupportedRelease: pieceMetadata?.maximumSupportedRelease ?? '9.9.9',
        actions: pieceMetadata?.actions ?? {},
        triggers: pieceMetadata?.triggers ?? {},
        pieceType: pieceMetadata?.pieceType ?? faker.helpers.enumValue(PieceType),
        packageType: pieceMetadata?.packageType ?? faker.helpers.enumValue(PackageType),
        archiveId: pieceMetadata?.archiveId,
    }
}
