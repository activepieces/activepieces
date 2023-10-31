import { Principal, PrincipalType, apId } from '@activepieces/shared'
import { accessTokenManager } from '../../src/app/authentication/lib/access-token-manager'
import { faker } from '@faker-js/faker'

export const generateTestToken = async (principal?: Partial<Principal>): Promise<string> => {
    return await accessTokenManager.generateToken({
        id: principal?.id ?? apId(),
        type: principal?.type ?? faker.helpers.enumValue(PrincipalType),
        projectId: principal?.projectId ?? apId(),
        projectType: principal?.projectType,
        platformId: principal?.platformId,
    })
}
