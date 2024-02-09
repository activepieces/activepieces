import { Static, Type } from '@sinclair/typebox'
import { User } from './user'

export const UserResponse = Type.Omit(User, ['password'])

export type UserResponse = Static<typeof UserResponse>
