import { Static, Type } from '@sinclair/typebox'
import { User } from '../../user/user'
import { UserIdentity } from '../user-identity'


export const UserWithoutPassword = Type.Pick(User, ['id', 'platformRole', 'status', 'externalId', 'platformId'])
export type UserWithoutPassword = Static<typeof UserWithoutPassword>

export const AuthenticationResponse = Type.Composite([
    UserWithoutPassword,
    Type.Pick(UserIdentity, ['verified', 'firstName', 'lastName', 'email', 'trackEvents', 'newsLetter']),
    Type.Object({
        token: Type.String(),
        projectId: Type.String(),
    }),
])
export type AuthenticationResponse = Static<typeof AuthenticationResponse>
