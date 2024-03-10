import { GitRepoEntity } from './git-repo.entity'
import {
    ConfigureRepoRequest,
    GitRepo,
    ProjectSyncError,
    PushGitRepoRequest,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    apId,
    ErrorCode,
    FlowStatus,
    isNil,
    SeekPage,
} from '@activepieces/shared'
import { SimpleGit, simpleGit } from 'simple-git'
import { databaseConnection } from '../../database/database-connection'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { gitSyncHelper } from './git-sync-helper'
import { projectService } from '../../project/project-service'
import { createOrUpdateFlowOperation, findFlowOperations } from './operations/project-diff.service'
import { ProjectMappingState, ProjectOperation } from './operations/sync-operations'
import fs from 'fs/promises'
import path from 'path'
import { userService } from '../../user/user-service'
import { ProjectSyncPlan, ProjectOperationType } from '@activepieces/ee-shared'
import { flowService } from '../../flows/flow/flow.service'

const repo = databaseConnection.getRepository(GitRepoEntity)

export const gitRepoService = {
    async upsert(request: ConfigureRepoRequest): Promise<GitRepo> {
        const existingRepo = await repo.findOneBy({ projectId: request.projectId })
        const id = existingRepo?.id ?? apId()
        await repo.upsert(
            {
                id,
                projectId: request.projectId,
                sshPrivateKey: request.sshPrivateKey,
                branch: request.branch,
                remoteUrl: request.remoteUrl,
                slug: request.slug,
            },
            ['projectId'],
        )
        return repo.findOneByOrFail({ id })
    },
    async getOneByProjectOrThrow({ projectId }: { projectId: string }): Promise<GitRepo> {
        const gitRepo = await repo.findOneByOrFail({ projectId })
        if (isNil(gitRepo)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'git-repo',
                },
            })
        }
        return gitRepo
    },
    async getOrThrow({ id }: { id: string }): Promise<GitRepo> {
        const gitRepo = await repo.findOneByOrFail({ id })
        if (isNil(gitRepo)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: id,
                    entityType: 'git-repo',
                },
            })
        }
        return gitRepo
    },
    async list({ projectId }: { projectId: string }): Promise<SeekPage<GitRepo>> {
        const repos = await repo.findBy({ projectId })
        return paginationHelper.createPage<GitRepo>(repos, null)
    },
    async push({ id, userId, request }: PushParams): Promise<ProjectSyncPlan> {
        const gitRepo = await gitRepoService.getOrThrow({ id })
        const { git, flowFolderPath } = await createGitRepoAndReturnPaths(gitRepo, userId)
        const gitProjectState = await gitSyncHelper.getStateFromGit(flowFolderPath)
        const project = await projectService.getOneOrThrow(gitRepo.projectId)
        const mappingState = gitRepo.mapping ? new ProjectMappingState(gitRepo.mapping) : ProjectMappingState.empty()
        const flow = await flowService.getOnePopulatedOrThrow({
            id: request.flowId,
            projectId: project.id,
        })
        const operations = [createOrUpdateFlowOperation({
            fromFlow: flow,
            destinationFlows: gitProjectState,
            mapping: mappingState,
        })]
        if (request.dryRun) {
            return toResponse(operations)
        }
        for (const operation of operations) {
            switch (operation.type) {
                case ProjectOperationType.CREATE_FLOW:
                case ProjectOperationType.UPDATE_FLOW:
                    await gitSyncHelper.upsertFlowToGit(operation.flow, flowFolderPath)
                    break
                case ProjectOperationType.DELETE_FLOW:
                    await gitSyncHelper.deleteFlowFromProject(operation.flow.id, flowFolderPath)
                    break
            }
        }
        await commitAndPush(git, gitRepo, request.commitMessage ?? `chore: updated flow ${flow.id}`)
        return toResponse(operations)
    },
    async pull({ gitRepo, dryRun, userId }: PullGitRepoRequest): Promise<ProjectSyncPlan> {
        const project = await projectService.getOneOrThrow(gitRepo.projectId)
        const { flowFolderPath } = await createGitRepoAndReturnPaths(gitRepo, userId)
        const gitProjectState = await gitSyncHelper.getStateFromGit(flowFolderPath)
        const mappingState = gitRepo.mapping ? new ProjectMappingState(gitRepo.mapping) : ProjectMappingState.empty()
        const dbProjectState = await gitSyncHelper.getStateFromDB(project.id)
        const operations = await findFlowOperations({
            fromFlows: gitProjectState,
            destinationFlows: dbProjectState,
            mapping: mappingState,
        })
        if (dryRun) {
            return toResponse(operations)
        }
        let newMappState: ProjectMappingState = ProjectMappingState.empty()
        const publishJobs: Promise<ProjectSyncError | null>[] = []
        for (const operation of operations) {
            switch (operation.type) {
                case ProjectOperationType.UPDATE_FLOW: {
                    const flowUpdated = await gitSyncHelper.updateFlowInProject(operation.targetFlow.id, operation.flow, gitRepo.projectId)
                    if (flowUpdated.status === FlowStatus.ENABLED) {
                        publishJobs.push(gitSyncHelper.republishFlow(flowUpdated.id, gitRepo.projectId))
                    }
                    newMappState = newMappState.mapFlow({
                        sourceId: operation.flow.id,
                        targetId: flowUpdated.id,
                    })
                    break
                }
                case ProjectOperationType.CREATE_FLOW: {
                    const flowCreated = await gitSyncHelper.createFlowInProject(operation.flow, gitRepo.projectId)
                    newMappState = newMappState.mapFlow({
                        sourceId: operation.flow.id,
                        targetId: flowCreated.id,
                    })
                    break
                }
                case ProjectOperationType.DELETE_FLOW:
                    await gitSyncHelper.deleteFlowFromProject(operation.flow.id, gitRepo.projectId)
                    break
            }
        }
        await repo.update({ id: gitRepo.id }, { mapping: newMappState })
        const errors = (await Promise.all(publishJobs)).filter((f): f is ProjectSyncError => f !== null)
        return toResponse(operations, errors)
    },
    async delete({ id, projectId }: DeleteParams): Promise<void> {
        const gitRepo = await repo.findOneBy({ id, projectId })
        if (isNil(gitRepo)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: id,
                    entityType: 'git-repo',
                },
            })
        }
        await repo.delete({ id, projectId })
    },
}

async function commitAndPush(
    git: SimpleGit,
    gitRepo: GitRepo,
    commitMessage: string,
): Promise<void> {
    await git.add('.')
    await git.commit(commitMessage)
    await git.push('origin', gitRepo.branch)
}

async function createGitRepoAndReturnPaths(
    gitRepo: GitRepo,
    userId: string,
): Promise<{ flowFolderPath: string, git: SimpleGit, stateFolderPath: string }> {
    const tmpFolder = path.join('/', 'tmp', 'repo', gitRepo.projectId)
    try {
        await fs.rmdir(tmpFolder, { recursive: true })
    }
    catch (e) {
        // ignore
    }
    const flowFolderPath = path.join(
        tmpFolder,
        'projects',
        gitRepo.slug,
        'flows',
    )
    await fs.mkdir(flowFolderPath, { recursive: true })
    const stateFolderPath = path.join(
        tmpFolder,
        'projects',
        gitRepo.slug,
        'state',
    )
    await fs.mkdir(stateFolderPath, { recursive: true })
    const git = await initGitRepo(gitRepo, tmpFolder)

    const { email, firstName, lastName } = await userService.getOneOrFail({
        id: userId,
    })
    await git.addConfig('user.email', email)
    await git.addConfig('user.name', `${firstName} ${lastName}`)
    return {
        git,
        flowFolderPath,
        stateFolderPath,
    }
}

async function initGitRepo(
    gitRepo: GitRepo,
    baseDir: string,
): Promise<SimpleGit> {
    const keyPath = await createOrGetSshKeyPath(gitRepo)
    const git = simpleGit({
        baseDir,
        binary: 'git',
    }).env('GIT_SSH_COMMAND', `ssh -i ${keyPath} -o StrictHostKeyChecking=no`)
    await git.init()
    await git.addRemote('origin', gitRepo.remoteUrl)
    await git.branch(['-M', gitRepo.branch])
    await git.pull('origin', gitRepo.branch)
    return git
}

async function createOrGetSshKeyPath(gitRepo: GitRepo): Promise<string> {
    const keyPath = path.resolve(path.join('tmp', 'keys', gitRepo.id))
    await fs.mkdir(path.dirname(keyPath), { recursive: true })
    await fs.writeFile(keyPath, gitRepo.sshPrivateKey)
    await fs.chmod(keyPath, 0o600)
    return keyPath
}

function toResponse(operations: ProjectOperation[], errors: ProjectSyncError[] = []) {
    return {
        errors,
        operations: operations.map((operation) => {
            return {
                type: operation.type,
                flow: {
                    id: operation.flow.id,
                    displayName: operation.flow.version.displayName,
                },
            }
        }),
    }
}

type PushParams = {
    id: string
    userId: string
    request: PushGitRepoRequest
}
type DeleteParams = {
    id: string
    projectId: string
}
type PullGitRepoRequest = {
    gitRepo: GitRepo
    userId: string
    dryRun: boolean
}
