import { apId, SignUpRequest, User, UserId, UserMeta, UserStatus } from '@activepieces/shared'
import { passwordHasher } from '../authentication/lib/password-hasher'
import { databaseConnection } from '../database/database-connection'
import { UserEntity } from './user-entity'

const userRepo = databaseConnection.getRepository(UserEntity)

type GetOneQuery = {
    email: string
}

export const userService = {
    async create(request: SignUpRequest): Promise<User> {
        const hashedPassword = await passwordHasher.hash(request.password)
        const user = {
            id: apId(),
            email: request.email,
            password: hashedPassword,
            firstName: request.firstName,
            lastName: request.lastName,
            trackEvents: request.trackEvents,
            newsLetter: request.newsLetter,
            status: UserStatus.VERIFIED,
        }
        return await userRepo.save(user)
    },
    async getMetaInfo({id}: {id: UserId}): Promise<UserMeta | null> {
        const user = await userRepo.findOneBy({id})
        if(!user){
            return null
        }
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        }
    },
    async getOneByEmail(query: GetOneQuery): Promise<User | null> {
        return await userRepo.findOneBy(query)
    },
}
