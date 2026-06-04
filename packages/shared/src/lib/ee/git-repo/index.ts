import { z } from 'zod'
import { BaseModelSchema, Nullable } from '../../core/common/base-model'
import { formErrors } from '../../form-errors'

const SAFE_SLUG_PATTERN = /^(?!\.{1,2}$)[A-Za-z0-9._-]{1,128}$/
const SAFE_BRANCH_PATTERN = /^(?!-)[A-Za-z0-9._/-]{1,255}$/
const SAFE_REMOTE_URL_PATTERN = /^git@[A-Za-z0-9.-]+:[A-Za-z0-9._/-]+(\.git)?$/

export enum GitBranchType {
    PRODUCTION = 'PRODUCTION',
    DEVELOPMENT = 'DEVELOPMENT',
}

export const GitRepo = z.object({
    ...BaseModelSchema,
    remoteUrl: z.string(),
    branch: z.string(),
    branchType: z.nativeEnum(GitBranchType),
    projectId: z.string(),
    sshPrivateKey: Nullable(z.string()),
    slug: z.string(),
})

export type GitRepo = z.infer<typeof GitRepo>

export const GitRepoWithoutSensitiveData = GitRepo.omit({ sshPrivateKey: true })
export type GitRepoWithoutSensitiveData = z.infer<typeof GitRepoWithoutSensitiveData>

export enum GitPushOperationType {
    PUSH_FLOW = 'PUSH_FLOW',
    DELETE_FLOW = 'DELETE_FLOW',
    PUSH_TABLE = 'PUSH_TABLE',
    DELETE_TABLE = 'DELETE_TABLE',
    PUSH_EVERYTHING = 'PUSH_EVERYTHING',
}

export const PushFlowsGitRepoRequest = z.object({
    type: z.union([z.literal(GitPushOperationType.PUSH_FLOW), z.literal(GitPushOperationType.DELETE_FLOW)]),
    commitMessage: z.string().min(1),
    externalFlowIds: z.array(z.string()),
})

export type PushFlowsGitRepoRequest = z.infer<typeof PushFlowsGitRepoRequest>

export const PushTablesGitRepoRequest = z.object({
    type: z.union([z.literal(GitPushOperationType.PUSH_TABLE), z.literal(GitPushOperationType.DELETE_TABLE)]),
    commitMessage: z.string().min(1),
    externalTableIds: z.array(z.string()),
})

export type PushTablesGitRepoRequest = z.infer<typeof PushTablesGitRepoRequest>

export const PushEverythingGitRepoRequest = z.object({
    type: z.literal(GitPushOperationType.PUSH_EVERYTHING),
    commitMessage: z.string().min(1),
})
export type PushEverythingGitRepoRequest = z.infer<typeof PushEverythingGitRepoRequest>

export const PushGitRepoRequest = z.union([PushFlowsGitRepoRequest, PushTablesGitRepoRequest, PushEverythingGitRepoRequest])

export type PushGitRepoRequest = z.infer<typeof PushGitRepoRequest>

export const ConfigureRepoRequest = z.object({
    projectId: z.string().min(1),
    remoteUrl: z.string().regex(SAFE_REMOTE_URL_PATTERN, formErrors.invalidGitRepoRemoteUrl),
    branch: z.string().regex(SAFE_BRANCH_PATTERN, formErrors.invalidGitRepoBranch),
    branchType: z.nativeEnum(GitBranchType),
    sshPrivateKey: z.string().min(1),
    slug: z.string().regex(SAFE_SLUG_PATTERN, formErrors.invalidGitRepoSlug),
})

export type ConfigureRepoRequest = z.infer<typeof ConfigureRepoRequest>
