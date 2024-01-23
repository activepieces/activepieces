import { User } from '../../user/user'

export type AuthenticationResponse = Omit<User, 'password'> & {
    token: string
    projectId: string
}
