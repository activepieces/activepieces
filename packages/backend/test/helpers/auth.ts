import { Principal, PrincipalType, apId } from '@activepieces/shared'
import { tokenUtils } from '../../src/app/authentication/lib/token-utils'
import { faker } from '@faker-js/faker'

export const generateTestToken = async (principal?: Partial<Principal>): Promise<string> => {
    return await tokenUtils.encode({
        id: principal?.id ?? apId(),
        type: principal?.type ?? faker.helpers.enumValue(PrincipalType),
        projectId: principal?.projectId ?? apId(),
        projectType: principal?.projectType,
        platformId: principal?.platformId,
    })
}
