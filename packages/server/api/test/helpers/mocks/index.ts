import {
    ApiKey,
    ApplicationEvent,
    ApplicationEventName,
    CustomDomain,
    CustomDomainStatus,
    GitBranchType,
    GitRepo,
    KeyAlgorithm,
    OAuthApp,
    OtpModel,
    OtpState,
    OtpType,
    ProjectMember,
    SigningKey,
} from '@activepieces/ee-shared'
import {
    apId,
    assertNotNullOrUndefined,
    File,
    FileCompression,
    FileLocation,
    FileType,
    FilteredPieceBehavior,
    Flow,
    FlowRun,
    FlowRunStatus,
    FlowStatus,
    FlowTemplate,
    FlowVersion,
    FlowVersionState,
    InvitationStatus,
    InvitationType,
    NotificationStatus,
    PackageType,
    PiecesFilterType,
    PieceType,
    Platform,
    PlatformRole,
    Project,
    ProjectPlan,
    ProjectRole,
    RoleType,
    RunEnvironment,
    TemplateType,
    TriggerType,
    User,
    UserInvitation,
    UserStatus,
} from '@activepieces/shared'
import { faker } from '@faker-js/faker'
import bcrypt from 'bcrypt'
import dayjs from 'dayjs'
import { databaseConnection } from '../../../src/app/database/database-connection'
import { generateApiKey } from '../../../src/app/ee/api-keys/api-key-service'
import { OAuthAppWithEncryptedSecret } from '../../../src/app/ee/oauth-apps/oauth-app.entity'
import { encryptUtils } from '../../../src/app/helper/encryption'
import { PieceMetadataSchema } from '../../../src/app/pieces/piece-metadata-entity'
import { PieceTagSchema } from '../../../src/app/tags/pieces/piece-tag.entity'
import { TagEntitySchema } from '../../../src/app/tags/tag-entity'

export const CLOUD_PLATFORM_ID = 'cloud-id'

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
        password: user?.password
            ? bcrypt.hashSync(user.password, 10)
            : faker.internet.password(),
        status: user?.status ?? UserStatus.ACTIVE,
        platformRole: user?.platformRole ?? faker.helpers.enumValue(PlatformRole),
        verified: user?.verified ?? faker.datatype.boolean(),
        externalId: user?.externalId,
        tokenVersion: user?.tokenVersion ?? undefined,
        platformId: user?.platformId ?? null,
    }
}

export const createMockOAuthApp = (
    oAuthApp?: Partial<OAuthApp>,
): OAuthAppWithEncryptedSecret => {
    return {
        id: oAuthApp?.id ?? apId(),
        created: oAuthApp?.created ?? faker.date.recent().toISOString(),
        updated: oAuthApp?.updated ?? faker.date.recent().toISOString(),
        platformId: oAuthApp?.platformId ?? apId(),
        pieceName: oAuthApp?.pieceName ?? faker.lorem.word(),
        clientId: oAuthApp?.clientId ?? apId(),
        clientSecret: encryptUtils.encryptString(faker.lorem.word()),
    }
}

export const createMockTemplate = (
    template?: Partial<FlowTemplate>,
): FlowTemplate => {
    return {
        name: template?.name ?? faker.lorem.word(),
        description: template?.description ?? faker.lorem.sentence(),
        type: template?.type ?? faker.helpers.enumValue(TemplateType),
        tags: template?.tags ?? [],
        pieces: template?.pieces ?? [],
        blogUrl: template?.blogUrl ?? faker.internet.url(),
        template: template?.template ?? createMockFlowVersion(),
        projectId: template?.projectId ?? apId(),
        platformId: template?.platformId ?? apId(),
        id: template?.id ?? apId(),
        created: template?.created ?? faker.date.recent().toISOString(),
        updated: template?.updated ?? faker.date.recent().toISOString(),
    }
}

export const createMockPlan = (plan?: Partial<ProjectPlan>): ProjectPlan => {
    return {
        id: plan?.id ?? apId(),
        created: plan?.created ?? faker.date.recent().toISOString(),
        updated: plan?.updated ?? faker.date.recent().toISOString(),
        projectId: plan?.projectId ?? apId(),
        name: plan?.name ?? faker.lorem.word(),
        aiTokens: plan?.aiTokens ?? 0,
        minimumPollingInterval: plan?.minimumPollingInterval ?? 0,
        connections: plan?.connections ?? 0,
        pieces: plan?.pieces ?? [],
        piecesFilterType: plan?.piecesFilterType ?? PiecesFilterType.NONE,
        teamMembers: plan?.teamMembers ?? 0,
        tasks: plan?.tasks ?? 0,
    }
}

export const createMockUserInvitation = (userInvitation: Partial<UserInvitation>): UserInvitation => {
    return {
        id: userInvitation.id ?? apId(),
        created: userInvitation.created ?? faker.date.recent().toISOString(),
        updated: userInvitation.updated ?? faker.date.recent().toISOString(),
        email: userInvitation.email ?? faker.internet.email(),
        type: userInvitation.type ?? faker.helpers.enumValue(InvitationType),
        platformId: userInvitation.platformId ?? apId(),
        projectId: userInvitation.projectId,
        projectRole: userInvitation.projectRole,
        platformRole: userInvitation.platformRole,
        status: userInvitation.status ?? faker.helpers.enumValue(InvitationStatus),
    }
}

export const createMockProject = (project?: Partial<Project>): Project => {
    return {
        id: project?.id ?? apId(),
        created: project?.created ?? faker.date.recent().toISOString(),
        updated: project?.updated ?? faker.date.recent().toISOString(),
        deleted: project?.deleted ?? null,
        ownerId: project?.ownerId ?? apId(),
        displayName: project?.displayName ?? faker.lorem.word(),
        notifyStatus:
            project?.notifyStatus ?? faker.helpers.enumValue(NotificationStatus),
        platformId: project?.platformId ?? apId(),
        externalId: project?.externalId ?? apId(),
    }
}

export const createMockGitRepo = (gitRepo?: Partial<GitRepo>): GitRepo => {
    return {
        id: gitRepo?.id ?? apId(),
        branchType: faker.helpers.enumValue(GitBranchType),
        created: gitRepo?.created ?? faker.date.recent().toISOString(),
        updated: gitRepo?.updated ?? faker.date.recent().toISOString(),
        projectId: gitRepo?.projectId ?? apId(),
        remoteUrl: gitRepo?.remoteUrl ?? `git@${faker.internet.url()}`,
        sshPrivateKey: gitRepo?.sshPrivateKey ?? faker.internet.password(),
        branch: gitRepo?.branch ?? faker.lorem.word(),
        slug: gitRepo?.slug ?? faker.lorem.word(),
    }
}

export const createMockPlatform = (platform?: Partial<Platform>): Platform => {
    return {
        id: platform?.id ?? apId(),
        analyticsEnabled: platform?.analyticsEnabled ?? false,
        created: platform?.created ?? faker.date.recent().toISOString(),
        updated: platform?.updated ?? faker.date.recent().toISOString(),
        ownerId: platform?.ownerId ?? apId(),
        enforceAllowedAuthDomains: platform?.enforceAllowedAuthDomains ?? false,
        federatedAuthProviders: platform?.federatedAuthProviders ?? {},
        allowedAuthDomains: platform?.allowedAuthDomains ?? [],
        name: platform?.name ?? faker.lorem.word(),
        auditLogEnabled: platform?.auditLogEnabled ?? false,
        primaryColor: platform?.primaryColor ?? faker.color.rgb(),
        logoIconUrl: platform?.logoIconUrl ?? faker.image.urlPlaceholder(),
        fullLogoUrl: platform?.fullLogoUrl ?? faker.image.urlPlaceholder(),
        emailAuthEnabled: platform?.emailAuthEnabled ?? true,
        globalConnectionsEnabled: platform?.globalConnectionsEnabled ?? false,
        customRolesEnabled: platform?.customRolesEnabled ?? false,
        pinnedPieces: platform?.pinnedPieces ?? [],
        defaultLocale: platform?.defaultLocale,
        favIconUrl: platform?.favIconUrl ?? faker.image.urlPlaceholder(),
        filteredPieceNames: platform?.filteredPieceNames ?? [],
        ssoEnabled: platform?.ssoEnabled ?? faker.datatype.boolean(),
        filteredPieceBehavior:
            platform?.filteredPieceBehavior ??
            faker.helpers.enumValue(FilteredPieceBehavior),
        smtp: platform?.smtp,
        flowIssuesEnabled: platform?.flowIssuesEnabled ?? faker.datatype.boolean(),
        gitSyncEnabled: platform?.gitSyncEnabled ?? faker.datatype.boolean(),
        embeddingEnabled: platform?.embeddingEnabled ?? faker.datatype.boolean(),
        cloudAuthEnabled: platform?.cloudAuthEnabled ?? faker.datatype.boolean(),
        showPoweredBy: platform?.showPoweredBy ?? faker.datatype.boolean(),
        managePiecesEnabled: platform?.managePiecesEnabled ?? faker.datatype.boolean(),
        manageProjectsEnabled: platform?.manageProjectsEnabled ?? faker.datatype.boolean(),
        manageTemplatesEnabled: platform?.manageTemplatesEnabled ?? faker.datatype.boolean(),
        customAppearanceEnabled: platform?.customAppearanceEnabled ?? faker.datatype.boolean(),
        apiKeysEnabled: platform?.apiKeysEnabled ?? faker.datatype.boolean(),
        customDomainsEnabled: platform?.customDomainsEnabled ?? faker.datatype.boolean(),
        projectRolesEnabled: platform?.projectRolesEnabled ?? faker.datatype.boolean(),
        alertsEnabled: platform?.alertsEnabled ?? faker.datatype.boolean(),
    }
}

export const createMockPlatformWithOwner = (
    params?: CreateMockPlatformWithOwnerParams,
): CreateMockPlatformWithOwnerReturn => {
    const mockOwnerId = params?.owner?.id ?? apId()
    const mockPlatformId = params?.platform?.id ?? apId()

    const mockOwner = createMockUser({
        ...params?.owner,
        id: mockOwnerId,
        platformId: mockPlatformId,
        platformRole: PlatformRole.ADMIN,
    })

    const mockPlatform = createMockPlatform({
        ...params?.platform,
        id: mockPlatformId,
        ownerId: mockOwnerId,
    })

    return {
        mockPlatform,
        mockOwner,
    }
}

export const createMockProjectMember = (
    projectMember?: Omit<Partial<ProjectMember>, 'projectRoleId'> & {
        projectRoleId: string
    },
): ProjectMember => {
    assertNotNullOrUndefined(projectMember?.userId, 'userId')
    return {
        id: projectMember?.id ?? apId(),
        created: projectMember?.created ?? faker.date.recent().toISOString(),
        updated: projectMember?.updated ?? faker.date.recent().toISOString(),
        platformId: projectMember?.platformId ?? apId(),
        projectRoleId: projectMember.projectRoleId,
        userId: projectMember?.userId,
        projectId: projectMember?.projectId ?? apId(),
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

export const createMockApiKey = (
    apiKey?: Partial<Omit<ApiKey, 'hashedValue' | 'truncatedValue'>>,
): ApiKey & { value: string } => {
    const { secretHashed, secretTruncated, secret } = generateApiKey()
    return {
        id: apiKey?.id ?? apId(),
        created: apiKey?.created ?? faker.date.recent().toISOString(),
        updated: apiKey?.updated ?? faker.date.recent().toISOString(),
        displayName: apiKey?.displayName ?? faker.lorem.word(),
        platformId: apiKey?.platformId ?? apId(),
        hashedValue: secretHashed,
        value: secret,
        truncatedValue: secretTruncated,
    }
}

export const setupMockApiKeyServiceAccount = (
    params?: SetupMockApiKeyServiceAccountParams,
): SetupMockApiKeyServiceAccountReturn => {

    const { mockOwner, mockPlatform } = createMockPlatformWithOwner({
        owner: params?.owner,
        platform: params?.platform,
    })

    const mockProject = createMockProject({
        ownerId: mockOwner.id,
        platformId: mockPlatform.id,
    })

    const mockApiKey = createMockApiKey({
        ...params?.apiKey,
        platformId: mockPlatform.id,
    })


    return {
        mockProject,
        mockOwner,
        mockPlatform,
        mockApiKey,
    }
}

export const createMockSigningKey = (
    signingKey?: Partial<SigningKey>,
): SigningKey => {
    return {
        id: signingKey?.id ?? apId(),
        created: signingKey?.created ?? faker.date.recent().toISOString(),
        updated: signingKey?.updated ?? faker.date.recent().toISOString(),
        displayName: signingKey?.displayName ?? faker.lorem.word(),
        platformId: signingKey?.platformId ?? apId(),
        publicKey: signingKey?.publicKey ?? MOCK_SIGNING_KEY_PUBLIC_KEY,
        algorithm: signingKey?.algorithm ?? KeyAlgorithm.RSA,
    }
}


export const createMockTag = (tag?: Partial<Omit<TagEntitySchema, 'platform'>>): Omit<TagEntitySchema, 'platform'> => {
    return {
        id: tag?.id ?? apId(),
        created: tag?.created ?? faker.date.recent().toISOString(),
        updated: tag?.updated ?? faker.date.recent().toISOString(),
        platformId: tag?.platformId ?? apId(),
        name: tag?.name ?? faker.lorem.word(),
    }
}


export const createMockPieceTag = (request: Partial<Omit<PieceTagSchema, 'platform' | 'tag'>>): Omit<PieceTagSchema, 'platform' | 'tag'> => {
    return {
        id: request.id ?? apId(),
        created: request.created ?? faker.date.recent().toISOString(),
        updated: request.updated ?? faker.date.recent().toISOString(),
        platformId: request.platformId ?? apId(),
        pieceName: request.pieceName ?? faker.lorem.word(),
        tagId: request.tagId ?? apId(),
    }
}

export const createMockPieceMetadata = (
    pieceMetadata?: Partial<Omit<PieceMetadataSchema, 'project'>>,
): Omit<PieceMetadataSchema, 'project'> => {
    return {
        id: pieceMetadata?.id ?? apId(),
        projectUsage: 0,
        created: pieceMetadata?.created ?? faker.date.recent().toISOString(),
        updated: pieceMetadata?.updated ?? faker.date.recent().toISOString(),
        name: pieceMetadata?.name ?? faker.lorem.word(),
        displayName: pieceMetadata?.displayName ?? faker.lorem.word(),
        logoUrl: pieceMetadata?.logoUrl ?? faker.image.urlPlaceholder(),
        description: pieceMetadata?.description ?? faker.lorem.sentence(),
        projectId: pieceMetadata?.projectId,
        directoryPath: pieceMetadata?.directoryPath,
        auth: pieceMetadata?.auth,
        authors: pieceMetadata?.authors ?? [],
        platformId: pieceMetadata?.platformId,
        version: pieceMetadata?.version ?? faker.system.semver(),
        minimumSupportedRelease: pieceMetadata?.minimumSupportedRelease ?? '0.0.0',
        maximumSupportedRelease: pieceMetadata?.maximumSupportedRelease ?? '9.9.9',
        actions: pieceMetadata?.actions ?? {},
        triggers: pieceMetadata?.triggers ?? {},
        pieceType: pieceMetadata?.pieceType ?? faker.helpers.enumValue(PieceType),
        packageType:
            pieceMetadata?.packageType ?? faker.helpers.enumValue(PackageType),
        archiveId: pieceMetadata?.archiveId,
        categories: pieceMetadata?.categories ?? [],
    }
}

export const createAuditEvent = (auditEvent: Partial<ApplicationEvent>) => {
    return {
        id: auditEvent.id ?? apId(),
        created: auditEvent.created ?? faker.date.recent().toISOString(),
        updated: auditEvent.updated ?? faker.date.recent().toISOString(),
        ip: auditEvent.ip ?? faker.internet.ip(),
        platformId: auditEvent.platformId,
        userId: auditEvent.userId,
        userEmail: auditEvent.userEmail ?? faker.internet.email(),
        action: auditEvent.action ?? faker.helpers.enumValue(ApplicationEventName),
        data: auditEvent.data ?? {},
    }
}

export const createMockCustomDomain = (
    customDomain?: Partial<CustomDomain>,
): CustomDomain => {
    return {
        id: customDomain?.id ?? apId(),
        created: customDomain?.created ?? faker.date.recent().toISOString(),
        updated: customDomain?.updated ?? faker.date.recent().toISOString(),
        domain: customDomain?.domain ?? faker.internet.domainName(),
        platformId: customDomain?.platformId ?? apId(),
        status: customDomain?.status ?? faker.helpers.enumValue(CustomDomainStatus),
    }
}

export const createMockOtp = (otp?: Partial<OtpModel>): OtpModel => {
    const now = dayjs()
    const twentyMinutesAgo = now.subtract(5, 'minutes')

    return {
        id: otp?.id ?? apId(),
        created: otp?.created ?? faker.date.recent().toISOString(),
        updated:
            otp?.updated ??
            faker.date
                .between({ from: twentyMinutesAgo.toDate(), to: now.toDate() })
                .toISOString(),
        type: otp?.type ?? faker.helpers.enumValue(OtpType),
        userId: otp?.userId ?? apId(),
        value:
            otp?.value ?? faker.number.int({ min: 100000, max: 999999 }).toString(),
        state: otp?.state ?? faker.helpers.enumValue(OtpState),
    }
}

export const createMockFlowRun = (flowRun?: Partial<FlowRun>): FlowRun => {
    return {
        id: flowRun?.id ?? apId(),
        created: flowRun?.created ?? faker.date.recent().toISOString(),
        updated: flowRun?.updated ?? faker.date.recent().toISOString(),
        projectId: flowRun?.projectId ?? apId(),
        flowId: flowRun?.flowId ?? apId(),
        tags: flowRun?.tags ?? [],
        steps: {},
        flowVersionId: flowRun?.flowVersionId ?? apId(),
        flowDisplayName: flowRun?.flowDisplayName ?? faker.lorem.word(),
        logsFileId: flowRun?.logsFileId ?? null,
        tasks: flowRun?.tasks,
        status: flowRun?.status ?? faker.helpers.enumValue(FlowRunStatus),
        startTime: flowRun?.startTime ?? faker.date.recent().toISOString(),
        finishTime: flowRun?.finishTime ?? faker.date.recent().toISOString(),
        environment:
            flowRun?.environment ?? faker.helpers.enumValue(RunEnvironment),
    }
}

export const createMockFlow = (flow?: Partial<Flow>): Flow => {
    return {
        id: flow?.id ?? apId(),
        created: flow?.created ?? faker.date.recent().toISOString(),
        updated: flow?.updated ?? faker.date.recent().toISOString(),
        projectId: flow?.projectId ?? apId(),
        status: flow?.status ?? faker.helpers.enumValue(FlowStatus),
        folderId: flow?.folderId ?? null,
        schedule: flow?.schedule ?? null,
        publishedVersionId: flow?.publishedVersionId ?? null,
    }
}

export const createMockFlowVersion = (
    flowVersion?: Partial<FlowVersion>,
): FlowVersion => {
    const emptyTrigger = {
        type: TriggerType.EMPTY,
        name: 'trigger',
        settings: {},
        valid: false,
        displayName: 'Select Trigger',
    } as const

    return {
        id: flowVersion?.id ?? apId(),
        created: flowVersion?.created ?? faker.date.recent().toISOString(),
        updated: flowVersion?.updated ?? faker.date.recent().toISOString(),
        displayName: flowVersion?.displayName ?? faker.word.words(),
        flowId: flowVersion?.flowId ?? apId(),
        trigger: flowVersion?.trigger ?? emptyTrigger,
        state: flowVersion?.state ?? faker.helpers.enumValue(FlowVersionState),
        updatedBy: flowVersion?.updatedBy,
        valid: flowVersion?.valid ?? faker.datatype.boolean(),
    }
}

export const mockBasicSetup = async (params?: MockBasicSetupParams): Promise<MockBasicSetup> => {
    const mockOwner = createMockUser({
        ...params?.user,
        platformRole: PlatformRole.ADMIN,
    })
    await databaseConnection().getRepository('user').save(mockOwner)

    const mockPlatform = createMockPlatform({
        ...params?.platform,
        ownerId: mockOwner.id,
        auditLogEnabled: true,
        apiKeysEnabled: true,
        customRolesEnabled: true,
        customDomainsEnabled: true,
    })
    await databaseConnection().getRepository('platform').save(mockPlatform)

    mockOwner.platformId = mockPlatform.id
    await databaseConnection().getRepository('user').save(mockOwner)

    const mockProject = createMockProject({
        ...params?.project,
        ownerId: mockOwner.id,
        platformId: mockPlatform.id,
    })
    await databaseConnection().getRepository('project').save(mockProject)

    return {
        mockOwner,
        mockPlatform,
        mockProject,
    }
}

export const createMockFile = (file?: Partial<File>): File => {
    return {
        id: file?.id ?? apId(),
        created: file?.created ?? faker.date.recent().toISOString(),
        updated: file?.updated ?? faker.date.recent().toISOString(),
        platformId: file?.platformId ?? apId(),
        projectId: file?.projectId ?? apId(),
        location: file?.location ?? FileLocation.DB,
        compression: file?.compression ?? faker.helpers.enumValue(FileCompression),
        data: file?.data ?? Buffer.from(faker.lorem.paragraphs()),
        type: file?.type ?? faker.helpers.enumValue(FileType),
    }
}

export const createMockProjectRole = (projectRole?: Partial<ProjectRole>): ProjectRole => {
    return {
        id: projectRole?.id ?? apId(),
        name: projectRole?.name ?? faker.lorem.word(),
        created: projectRole?.created ?? faker.date.recent().toISOString(),
        updated: projectRole?.updated ?? faker.date.recent().toISOString(),
        permissions: projectRole?.permissions ?? [],
        platformId: projectRole?.platformId ?? apId(),
        type: projectRole?.type ?? faker.helpers.enumValue(RoleType),
    }
}

type CreateMockPlatformWithOwnerParams = {
    platform?: Partial<Omit<Platform, 'ownerId'>>
    owner?: Partial<Omit<User, 'platformId'>>
}

type CreateMockPlatformWithOwnerReturn = {
    mockPlatform: Platform
    mockOwner: User
}

type SetupMockApiKeyServiceAccountParams = CreateMockPlatformWithOwnerParams & {
    apiKey?: Partial<Omit<ApiKey, 'hashedValue' | 'truncatedValue'>>
}

type SetupMockApiKeyServiceAccountReturn = CreateMockPlatformWithOwnerReturn & {
    mockProject: Project
    mockApiKey: ApiKey & { value: string }
}

type MockBasicSetup = {
    mockOwner: User
    mockPlatform: Platform
    mockProject: Project
}

type MockBasicSetupParams = {
    user?: Partial<User>
    platform?: Partial<Platform>
    project?: Partial<Project>
}
