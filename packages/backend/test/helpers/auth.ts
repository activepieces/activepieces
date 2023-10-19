import { PrincipalType } from '@activepieces/shared'
import { tokenUtils } from '../../src/app/authentication/lib/token-utils'

export const generateTestToken = async (): Promise<string> => {
    return await tokenUtils.encode({
        id: 'userId',
        type: PrincipalType.USER,
        projectId: 'projectId',
    })
}
