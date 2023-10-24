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
    async create(request: SignUpRequest, status: UserStatus): Promise<User> {
        const hashedPassword = await passwordHasher.hash(request.password)
        const user = {
            id: apId(),
            email: request.email,
            password: hashedPassword,
            firstName: request.firstName,
            lastName: request.lastName,
            trackEvents: request.trackEvents,
            newsLetter: request.newsLetter,
            status,
        }
        const existingUser = await userRepo.findOneBy({
            email: request.email,
        })
        if (!isNil(existingUser) && existingUser.status === UserStatus.SHADOW) {
            user.id = existingUser.id
            await userRepo.update(user.id, user)
            return userRepo.findOneByOrFail({
                email: request.email,
            })
        }
        return userRepo.save(user)
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
}
