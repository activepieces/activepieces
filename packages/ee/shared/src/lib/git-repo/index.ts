import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "@activepieces/shared";

export const GitRepo = Type.Object({
    ...BaseModelSchema,
    remoteUrl: Type.String(),
    branch: Type.String(),
    projectId: Type.String(),
    sshPrivateKey: Type.String(),
})

export type GitRepo = Static<typeof GitRepo>

export const GitRepoWithoutSenestiveData = Type.Omit(GitRepo, ['sshPrivateKey'])
export type GitRepoWithoutSenestiveData = Static<typeof GitRepoWithoutSenestiveData>

export const PushGitRepoRequest = Type.Object({
    commitMessage: Type.String(),
})

export type PushGitRepoRequest = Static<typeof PushGitRepoRequest>

export const ConfigureRepoRequest = Type.Object({
    projectId: Type.String(),
    remoteUrl: Type.String({
        pattern: '^git@',
    }),
    branch: Type.String(),
    sshPrivateKey: Type.String(),
})

export type ConfigureRepoRequest = Static<typeof ConfigureRepoRequest>
