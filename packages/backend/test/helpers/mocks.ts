import { Platform } from '@activepieces/ee-shared'
import { UserStatus, User, apId } from '@activepieces/shared'
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
        status: user?.status ?? UserStatus.VERIFIED,
        imageUrl: user?.imageUrl ?? faker.image.urlPlaceholder(),
        title: user?.title ?? faker.lorem.sentence(),
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
