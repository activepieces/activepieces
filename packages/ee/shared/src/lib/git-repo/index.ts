import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "@activepieces/shared";

export enum GitBranchType {
    PRODUCTION = 'PRODUCTION',
    DEVELOPMENT = 'DEVELOPMENT',
}

export const GitRepo = Type.Object({
    ...BaseModelSchema,
    remoteUrl: Type.String(),
    branch: Type.String(),
    branchType: Type.Enum(GitBranchType),
    projectId: Type.String(),
    sshPrivateKey: Type.String(),
    slug: Type.String(),
})

export type GitRepo = Static<typeof GitRepo>

export const GitRepoWithoutSensitiveData = Type.Omit(GitRepo, ['sshPrivateKey'])
export type GitRepoWithoutSensitiveData = Static<typeof GitRepoWithoutSensitiveData>

export enum GitPushOperationType {
    PUSH_FLOW = 'PUSH_FLOW',
    DELETE_FLOW = 'DELETE_FLOW',
}

export const PushGitRepoRequest = Type.Object({
    type: Type.Enum(GitPushOperationType),
    commitMessage: Type.String({
        minLength: 1,
    }),
    flowIds: Type.Array(Type.String())
})

export type PushGitRepoRequest = Static<typeof PushGitRepoRequest>

export const ConfigureRepoRequest = Type.Object({
    projectId: Type.String({
        minLength: 1,
    }),
    remoteUrl: Type.String({
        pattern: '^git@',
    }),
    branch: Type.String({
        minLength: 1,
    }),
    branchType: Type.Enum(GitBranchType),
    sshPrivateKey: Type.String({
        minLength: 1,
    }),
    slug: Type.String({
        minLength: 1,
    }),
})

export type ConfigureRepoRequest = Static<typeof ConfigureRepoRequest>