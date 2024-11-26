import { Project, User } from '@activepieces/shared'

export enum Provider {
    EMAIL = 'EMAIL',
    FEDERATED = 'FEDERATED',
}

export type AuthenticationServiceHooks = {
    preSignIn(p: PreParams): Promise<void>
    preSignUp(p: PreParams): Promise<void>
    postSignUp(p: PostParams): Promise<PostResult>
    postSignIn(p: PostParams): Promise<PostResult>
}

type PreParams = {
    email: string
    platformId: string | null
    provider: Provider
}

type PostParams = {
    user: User
    referringUserId?: string
}

type PostResult = {
    user: User
    project: Project
    token: string
}
