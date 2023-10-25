import { Principal, PrincipalType } from '@activepieces/shared'
import { tokenUtils } from '../../src/app/authentication/lib/token-utils'

export const generateTestToken = async (principal?: Partial<Principal>): Promise<string> => {
    return await tokenUtils.encode({
        id: principal?.id ?? 'userId',
        type: principal?.type ?? PrincipalType.USER,
        projectId: principal?.projectId ?? 'projectId',
    })
}
