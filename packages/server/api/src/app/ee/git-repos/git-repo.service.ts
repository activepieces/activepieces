import { SimpleGit, simpleGit } from 'simple-git'
import fs from 'fs/promises'
import path from 'path'
import { databaseConnection } from '../../database/database-connection'
import { GitRepoEntity } from './git-repo.entity'
import {
    ConfigureRepoRequest,
    GitRepo,
    PushGitRepoRequest,
    PushSyncMode,
} from '@activepieces/ee-shared'
import {
    ActivepiecesError,
    apId,
    ErrorCode,
    isNil,
    SeekPage,
} from '@activepieces/shared'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { FlowSyncOperation, gitSyncHelper } from './git-sync-helper'
import { flowService } from '../../flows/flow/flow.service'
import { userService } from '../../user/user-service'

const repo = databaseConnection.getRepository(GitRepoEntity)

export const gitRepoService = {
    async upsert({
        projectId,
        sshPrivateKey,
        branch,
        remoteUrl,
        slug,
    }: ConfigureRepoRequest): Promise<GitRepo> {
        const existingRepo = await repo.findOneBy({ projectId })
        const id = existingRepo?.id ?? apId()
        await repo.upsert(
            {
                id,
                projectId,
                sshPrivateKey,
                branch,
                remoteUrl,
                slug,
            },
            ['projectId'],
        )
        return repo.findOneByOrFail({ id })
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
    async push({
        id,
        userId,
        request,
    }: {
        id: string
        userId: string
        request: PushGitRepoRequest
    }): Promise<void> {
        const gitRepo = await gitRepoService.getOrThrow({ id })
        const { flowFolderPath, git } = await createGitRepoAndReturnPaths(gitRepo)
        const { email, firstName, lastName } = await userService.getOneOrFail({
            id: userId,
        })
        await git.addConfig('user.email', email)
        await git.addConfig('user.name', `${firstName} ${lastName}`)
        let operations: FlowSyncOperation[] = []
        switch (request.mode) {
            case PushSyncMode.FLOW: {
                operations = [
                    {
                        type: 'upsert_flow_into_git',
                        flow: await flowService.getOnePopulatedOrThrow({
                            id: request.flowId,
                            projectId: gitRepo.projectId,
                            versionId: undefined,
                            removeSecrets: false,
                        }),
                    },
                ]
                break
            }
            case PushSyncMode.PROJECT: {
                operations = await planPushOperations(
                    gitRepo.projectId,
                    flowFolderPath,
                )
                break
            }
        }
        await gitSyncHelper.applyFlowOperations({
            projectId: gitRepo.projectId,
            flowFolderPath,
            operations,
        })
        await commitAndPush(git, gitRepo, request.commitMessage)
    },
    async pull({ id }: PullGitRepoRequest): Promise<void> {
        const gitRepo = await gitRepoService.getOrThrow({ id })
        const { flowFolderPath } = await createGitRepoAndReturnPaths(gitRepo)
        const operations: FlowSyncOperation[] = await planPullOperations(
            gitRepo.projectId,
            flowFolderPath,
        )
        await gitSyncHelper.applyFlowOperations({
            projectId: gitRepo.projectId,
            flowFolderPath,
            operations,
        })
    },
    async delete({
        id,
        projectId,
    }: {
        id: string
        projectId: string
    }): Promise<void> {
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

async function planPullOperations(
    projectId: string,
    flowPath: string,
): Promise<FlowSyncOperation[]> {
    const projectFlows = await gitSyncHelper.fetchFlowsForProject(projectId)
    const gitFlows = await gitSyncHelper.parseFlowsFromDirectory(flowPath)
    const deleteOperations: FlowSyncOperation[] = projectFlows
        .filter((f) => gitFlows.findIndex((pf) => pf.id === f.id) === -1)
        .map((flow) => {
            return {
                type: 'delete_flow_from_project',
                flowId: flow.id,
            }
        })
    const upsertOperations: FlowSyncOperation[] = gitFlows.map((flow) => {
        return {
            type: 'upsert_flow_into_project',
            flow,
        }
    })
    return [...deleteOperations, ...upsertOperations]
}

async function planPushOperations(
    projectId: string,
    flowPath: string,
): Promise<FlowSyncOperation[]> {
    const projectFlows = await gitSyncHelper.fetchFlowsForProject(projectId)
    const gitFlows = await gitSyncHelper.parseFlowsFromDirectory(flowPath)
    const deleteOperations: FlowSyncOperation[] = gitFlows
        .filter((f) => projectFlows.findIndex((pf) => pf.id === f.id) === -1)
        .map((flow) => {
            return {
                type: 'delete_flow_from_git',
                flowId: flow.id,
            }
        })
    const upsertOperations: FlowSyncOperation[] = projectFlows.map((flow) => {
        return {
            type: 'upsert_flow_into_git',
            flow,
        }
    })
    return [...deleteOperations, ...upsertOperations]
}

async function createGitRepoAndReturnPaths(
    gitRepo: GitRepo,
): Promise<{ flowFolderPath: string, git: SimpleGit }> {
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
    const git = await initGitRepo(gitRepo, tmpFolder)
    return {
        git,
        flowFolderPath,
    }
}

async function createOrGetSshKeyPath(gitRepo: GitRepo): Promise<string> {
    const keyPath = path.resolve(path.join('tmp', 'keys', gitRepo.id))
    await fs.mkdir(path.dirname(keyPath), { recursive: true })
    await fs.writeFile(keyPath, gitRepo.sshPrivateKey)
    await fs.chmod(keyPath, 0o600)
    return keyPath
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

async function commitAndPush(
    git: SimpleGit,
    gitRepo: GitRepo,
    commitMessage: string,
): Promise<void> {
    await git.add('.')
    await git.commit(commitMessage)
    await git.push('origin', gitRepo.branch)
}

type PullGitRepoRequest = {
    id: string
}
