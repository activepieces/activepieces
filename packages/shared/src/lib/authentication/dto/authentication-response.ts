import { ProjectMemberRole } from '../../project'
import { User } from '../../user/user'

export type UserWithoutPassword = Omit<User, 'password'>

export type AuthenticationResponse = UserWithoutPassword & {
    token: string
    projectId: string
    projectRole: ProjectMemberRole | null
}
