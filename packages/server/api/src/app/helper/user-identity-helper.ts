import { UserIdentityProvider } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { userService } from '../user/user-service'

export const userIdentityHelper = (log: FastifyBaseLogger) => ({
    async isUserEmbedded(userId: string): Promise<boolean> {
        const user = await userService(log).getOneOrFail({ id: userId })
        const userIdentity = await userIdentityService(log).getOneOrFail({ id: user.identityId })
        return userIdentity.provider === UserIdentityProvider.JWT
    },
})
