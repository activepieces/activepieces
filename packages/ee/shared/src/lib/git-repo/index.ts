import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "@activepieces/shared";

export const GitRepo = Type.Object({
    ...BaseModelSchema,
    remoteUrl: Type.String(),
    branch: Type.String(),
    projectId: Type.String(),
})

export type GitRepo = Static<typeof GitRepo>


export const PushGitRepoRequest = Type.Object({
    projectId: Type.String(),
    commitMessage: Type.String(),
})

export type PushRepoRequest = Static<typeof PushGitRepoRequest>

export const CreateRepoRequest = Type.Object({
    projectId: Type.String(),
    remoteUrl: Type.String(),
    branch: Type.String(),
})

export type CreateRepoRequest = Static<typeof CreateRepoRequest>

export const PullRepoRequest = Type.Object({
    projectId: Type.String(),
})

export type PullRepoRequest = Static<typeof PullRepoRequest>