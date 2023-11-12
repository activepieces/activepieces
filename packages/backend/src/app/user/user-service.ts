import { apId, SignUpRequest, User, UserId, UserMeta, UserStatus } from '@activepieces/shared'
import { passwordHasher } from '../authentication/lib/password-hasher'
import { databaseConnection } from '../database/database-connection'
import { UserEntity } from './user-entity'
import { isNil } from 'lodash'

const userRepo = databaseConnection.getRepository(UserEntity)

type GetOneQuery = {
    email: string
}

export const userService = {
    async create(params: CreateParams): Promise<User> {
        const { email, password } = params
        const hashedPassword = await passwordHasher.hash(password)

        const user: NewUser = {
            id: apId(),
            ...params,
            password: hashedPassword,
        }

        const existingUser = await userRepo.findOneBy({
            email,
        })

        if (!isNil(existingUser) && existingUser.status === UserStatus.SHADOW) {
            user.id = existingUser.id
            await userRepo.update(user.id, user)
            return userRepo.findOneByOrFail({
                email,
            })
        }

        return userRepo.save(user)
    },
    async verify({ userId }: { userId: string }): Promise<User> {
        const user = await userRepo.findOneByOrFail({ id: userId })
    
        if (user.status === UserStatus.SHADOW) {
            await userRepo.update(userId, { status: UserStatus.VERIFIED })
        }
    
        return {
            ...user,
            status: UserStatus.VERIFIED,
        }  
    },    
    async getMetaInfo({ id }: { id: UserId }): Promise<UserMeta | null> {
        const user = await userRepo.findOneBy({ id })
        if (!user) {
            return null
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            title: user.title,
        }
    },

    async getOneByEmail(query: GetOneQuery): Promise<User | null> {
        const { email } = query
        const user = await userRepo.createQueryBuilder().where('LOWER(email) LIKE LOWER(:email)', { email: `${email}` }).getOne()
        return user || null
    },

    async getByExternalId(externalId: string): Promise<User | null> {
        return userRepo.findOneBy({
            externalId,
        })
    },
}

type CreateParams = SignUpRequest & {
    status: UserStatus
    externalId?: string
}

type NewUser = Omit<User, 'created' | 'updated'>
