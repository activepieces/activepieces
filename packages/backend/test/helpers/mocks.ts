import { KeyAlgorithm, SigningKey, Platform } from '@activepieces/ee-shared'
import { UserStatus, User, apId, Project, NotificationStatus, ProjectType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'

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

export const createMockSigningKey = (signingKey?: Partial<SigningKey>): SigningKey => {
    return {
        id: signingKey?.id ?? apId(),
        created: signingKey?.created ?? faker.date.recent().toISOString(),
        updated: signingKey?.updated ?? faker.date.recent().toISOString(),
        displayName: signingKey?.displayName ?? faker.lorem.word(),
        platformId: signingKey?.platformId ?? apId(),
        publicKey: signingKey?.publicKey ?? faker.lorem.word(),
        generatedBy: signingKey?.generatedBy ??  apId(),
        algorithm: signingKey?.algorithm ?? faker.helpers.enumValue(KeyAlgorithm),
    }
}
