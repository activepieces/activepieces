import { SimpleGit, simpleGit } from 'simple-git'
import fs from 'fs/promises'
import path from 'path'
import { flowService } from '../../flows/flow/flow.service'
import { databaseConnection } from '../../database/database-connection'
import { GitRepoEntity } from './git-repo.entity'
import { CreateRepoRequest, GitRepo } from '@activepieces/ee-shared'
import { apId, Flow, isNil, SeekPage } from '@activepieces/shared'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { logger } from '../../helper/logger'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'

type DeleteFlowOperation = {
    type: 'delete'
    flowId: string
}

type UpsertFlowOperation = {
    type: 'upsert'
    flow: Flow
}

type FlowOperation = DeleteFlowOperation | UpsertFlowOperation

const repo = databaseConnection.getRepository(GitRepoEntity)

export const gitRepoService = {
    async upsert({ projectId, branch, remoteUrl }: CreateRepoRequest): Promise<void> {
        await repo.upsert({
            id: apId(),
            projectId,
            branch,
            remoteUrl,
        }, ['projectId'])
    },
    async list({ projectId }: { projectId: string }): Promise<SeekPage<GitRepo>> {
        const repos = await repo.findBy({ projectId })
        
        return paginationHelper.createPage<GitRepo>(repos, null)
    },
    async push({ projectId, commitMessage }: PushGitRepoRequest): Promise<void> {
        const flowPath = await getFolderPath(projectId)
        const git = await initGitRepo(flowPath)
        
        //const { data: projectFlows } = await flowService.list({ projectId, cursorRequest: null, limit: 1000, folderId: undefined })
        //const flowFiles = await fs.readdir(flowPath)

        await commitAndPush(git, commitMessage)

    },
    async pull({ projectId }: PullGitRepoRequest): Promise<void> {
        const { flowPath } = await getOrCreateFolderForGit({ projectId })
        await processFlowFiles(flowPath)
    },
}

async function commitAndPush(git: SimpleGit, commitMessage: string): Promise<void> {
    await git.add('.')
    await git.commit(commitMessage)
    await git.push('origin', 'main')
}

async function getFolderPath(projectId: string): Promise<string> {
    const tmpFolder = path.join('/', 'tmp', 'repo', projectId)
    try {
        await fs.rmdir(tmpFolder, { recursive: true })
    }
    catch (e) {
        // ignore
    }
    const flowPath = path.join(tmpFolder, 'flows')
    await fs.mkdir(flowPath, { recursive: true })
    return flowPath
}

async function initGitRepo(baseDir: string): Promise<SimpleGit> {
    const git = simpleGit({
        baseDir,
        binary: 'git',
    })
    await git.init()
    await git.addRemote('origin', 'https://github.com/abuaboud/super-octo-fortnight.git')
    await git.branch(['-M', 'main'])
    await git.pull('origin', 'main')
    return git
}

async function planOperations(projectId: string, flowPath: string) {
    
}

async function removeDeletedFlowFiles({ projectId, flowPath }: { projectId: string, flowPath: string }): Promise<void> {
    const { data } = await flowService.list({ projectId, cursorRequest: null, limit: 1000, folderId: undefined })
    const flowFilesName = data.map(flow => flow.id + '.json')
    const files = await fs.readdir(flowPath)
    for (const file of files) {
        if (!flowFilesName.includes(file)) {
            await fs.unlink(path.join(flowPath, file))
        }
    }
}

async function saveFlowsToFiles({ projectId, flowPath }: { projectId: string, flowPath: string }): Promise<void> {
    const { data: flows } = await flowService.list({ projectId, cursorRequest: null, limit: 1000, folderId: undefined })
    for (const flow of flows) {
        // TODO remove sample data from flow version
        await fs.writeFile(path.join(flowPath, flow.id + '.json'), JSON.stringify(flow, null, 2))
    }
}

async function processFlowFiles(flowPath: string): Promise<void> {
    const flows = await fs.readdir(flowPath)
    for (const file of flows) {
        const flow: Flow = JSON.parse(await fs.readFile(path.join(flowPath, file), 'utf-8'))
        const projectFlow = await flowVersionService.getOne(flow.id)
        if (isNil(projectFlow)) {
            await flowService.delete({
                projectId: flow.projectId,
                flowId: flow.id,
            })
        }
        else {
            // TODO remove sample data from flow version
        }
        logger.info(flow)
    }
}

type PushGitRepoRequest = {
    projectId: string
    commitMessage: string
}

type PullGitRepoRequest = {
    projectId: string
}
