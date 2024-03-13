import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "@activepieces/shared";

export enum ProjectOperationType {
    UPDATE_FLOW = 'UPDATE_FLOW',
    CREATE_FLOW = 'CREATE_FLOW',
    DELETE_FLOW = 'DELETE_FLOW',
}

export const GitProjectMappingState = Type.Object({
    flows: Type.Record(Type.String(), Type.Object({
        sourceId: Type.String(),
    })),
})

export type GitProjectMappingState = Static<typeof GitProjectMappingState>

export const GitRepo = Type.Object({
    ...BaseModelSchema,
    remoteUrl: Type.String(),
    branch: Type.String(),
    projectId: Type.String(),
    sshPrivateKey: Type.String(),
    slug: Type.String(),
    mapping: Type.Optional(GitProjectMappingState),
})

export type GitRepo = Static<typeof GitRepo>

export const GitRepoWithoutSensitiveData = Type.Omit(GitRepo, ['sshPrivateKey'])
export type GitRepoWithoutSensitiveData = Static<typeof GitRepoWithoutSensitiveData>


export const PushGitRepoRequest = Type.Object({
    commitMessage: Type.String(),
    flowId: Type.String(),
    dryRun: Type.Optional(Type.Boolean()),
})

export type PushGitRepoRequest = Static<typeof PushGitRepoRequest>

export const PullGitRepoFromPojectRequest = Type.Object({
    projectId: Type.String(),
})
export type PullGitRepoFromPojectRequest = Static<typeof PullGitRepoFromPojectRequest>

export const PullGitRepoRequest = Type.Object({
    dryRun: Type.Optional(Type.Boolean()),
})
export type PullGitRepoRequest = Static<typeof PullGitRepoRequest>

export const ConfigureRepoRequest = Type.Object({
    projectId: Type.String(),
    remoteUrl: Type.String({
        pattern: '^git@',
    }),
    branch: Type.String(),
    sshPrivateKey: Type.String(),
    slug: Type.String(),
})

export type ConfigureRepoRequest = Static<typeof ConfigureRepoRequest>

export const ProjectSyncError = Type.Object({
    flowId: Type.String(),
    message: Type.String(),
})
export type ProjectSyncError = Static<typeof ProjectSyncError>

export const ProjectSyncPlan = Type.Object({
    operations: Type.Array(Type.Object({
        type: Type.Enum(ProjectOperationType),
        flow: Type.Object({
            id: Type.String(),
            displayName: Type.String(),
        }),
    })),
    errors: Type.Array(ProjectSyncError),
})

export type ProjectSyncPlan = Static<typeof ProjectSyncPlan>