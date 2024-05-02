import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "@activepieces/shared";

export enum ProjectOperationType {
    UPDATE_FLOW = 'UPDATE_FLOW',
    CREATE_FLOW = 'CREATE_FLOW',
    DELETE_FLOW = 'DELETE_FLOW',
}

export enum GitBranchType {
    PRODUCTION = 'PRODUCTION',
    DEVELOPMENT = 'DEVELOPMENT',
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
    branchType: Type.Enum(GitBranchType),
    projectId: Type.String(),
    sshPrivateKey: Type.String(),
    slug: Type.String(),
    mapping: Type.Optional(GitProjectMappingState),
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
    commitMessage: Type.String(),
    flowId: Type.String()
})

export type PushGitRepoRequest = Static<typeof PushGitRepoRequest>

export const PullGitRepoFromProjectRequest = Type.Object({
    projectId: Type.String(),
})
export type PullGitRepoFromProjectRequest = Static<typeof PullGitRepoFromProjectRequest>

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
    branchType: Type.Enum(GitBranchType),
    sshPrivateKey: Type.String(),
    slug: Type.String(),
})

export type ConfigureRepoRequest = Static<typeof ConfigureRepoRequest>

export const ProjectSyncError = Type.Object({
    flowId: Type.String(),
    message: Type.String(),
})
export type ProjectSyncError = Static<typeof ProjectSyncError>

export const ProjectSyncPlanOperation = Type.Union([
    Type.Object({
        type: Type.Literal(ProjectOperationType.CREATE_FLOW),
        flow: Type.Object({
            id: Type.String(),
            displayName: Type.String(),
        }),
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.UPDATE_FLOW),
        flow: Type.Object({
            id: Type.String(),
            displayName: Type.String(),
        }),
        targetFlow: Type.Object({
            id: Type.String(),
            displayName: Type.String(),
        }),
    }),
    Type.Object({
        type: Type.Literal(ProjectOperationType.DELETE_FLOW),
        flow: Type.Object({
            id: Type.String(),
            displayName: Type.String(),
        }),
    }),
])

export type ProjectSyncPlanOperation = Static<typeof ProjectSyncPlanOperation>

export const ProjectSyncPlan = Type.Object({
    operations: Type.Array(ProjectSyncPlanOperation),
    errors: Type.Array(ProjectSyncError),
})

export type ProjectSyncPlan = Static<typeof ProjectSyncPlan>
