import { User } from '@activepieces/shared'
import { EntityManager } from 'typeorm'
import { hooksFactory } from '../helper/hooks-factory'

export const userHooks = hooksFactory.create<UserHooks>(_log => ({
    postCreate: async (_params: UserPostCreateParams) => {
        return
    },
}))

export type UserPostCreateParams = {
    user: User
    email: string
    platformId: string
    defaultProjectIds: string[]
    platformRoleAssigned: boolean
    entityManager: EntityManager
}

export type UserHooks = {
    postCreate(params: UserPostCreateParams): Promise<void>
}
