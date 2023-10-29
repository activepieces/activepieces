import { Project, User } from '@activepieces/shared'

export type AuthenticationServiceHooks = {
    postSignUp(p: PostParams): Promise<PostResult>
    postSignIn(p: PostParams): Promise<PostResult>
}

type PostParams = {
    user: User
}

type PostResult = {
    user: User
    project: Project
    token: string
}
