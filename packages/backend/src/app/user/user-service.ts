import { apId, SignUpRequest, User, UserId, UserMeta, UserStatus } from '@activepieces/shared'
import { passwordHasher } from '../authentication/lib/password-hasher'
import { databaseConnection } from '../database/database-connection'
import { UserEntity } from './user-entity'

const userRepo = databaseConnection.getRepository(UserEntity)

type GetOneQuery = {
    email: string
}

export const userService = {
    async upsert(request: SignUpRequest): Promise<User> {
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
        await userRepo.upsert(user, ['email'])
        return userService.getOneByEmail({ email: request.email })
    },
    async getByEmailOrCreateShadow({ email }: { email: string }): Promise<User> {
        const user = await userService.getOneByEmail({ email });
        if (!user) {
            const shadowUser = {
                id: apId(),
                email: email,
                password: '',
                firstName: '',
                lastName: '',
                trackEvents: false,
                newsLetter: false,
                status: UserStatus.SHADOW,
            }
            await userRepo.upsert(shadowUser, ['email'])
            return userService.getOneByEmail({ email })
        }
        return user
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
