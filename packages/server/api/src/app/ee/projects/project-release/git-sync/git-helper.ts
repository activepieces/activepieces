import fs from 'fs/promises'
import path from 'path'
import { fileSystemUtils } from '@activepieces/server-utils'
import { ActivepiecesError, ApEnvironment, ConfigureRepoRequest, ErrorCode, GitRepo } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { nanoid } from 'nanoid'
import simpleGit, { SimpleGit } from 'simple-git'
import { userIdentityService } from '../../../../authentication/user-identity/user-identity-service'
import { system } from '../../../../helper/system/system'
import { AppSystemProp } from '../../../../helper/system/system-props'
import { userService } from '../../../../user/user-service'


export const gitHelper = {
    commitAndPush,
    createGitRepoAndReturnPaths,
    validateConnection,
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
    log: FastifyBaseLogger,
    gitRepo: GitRepo,
    userId: string,
): Promise<{ flowFolderPath: string, git: SimpleGit, stateFolderPath: string, connectionsFolderPath: string, tablesFolderPath: string }> {
    assertSafeSlug(gitRepo.slug)
    const tmpFolder = path.join('/', 'tmp', 'repo', gitRepo.projectId)
    try {
        await fs.rmdir(tmpFolder, { recursive: true })
    }
    catch (e) {
        // ignore
    }
    await fs.mkdir(tmpFolder, { recursive: true })
    const projectRoot = path.join(tmpFolder, 'projects', gitRepo.slug)
    await fileSystemUtils.assertPathInside({ baseDir: tmpFolder, targetPath: projectRoot })
    const flowFolderPath = path.join(projectRoot, 'flows')
    const connectionsFolderPath = path.join(projectRoot, 'connections')
    const tablesFolderPath = path.join(projectRoot, 'tables')
    const stateFolderPath = path.join(projectRoot, 'state')
    await fs.mkdir(flowFolderPath, { recursive: true })
    await fs.mkdir(connectionsFolderPath, { recursive: true })
    await fs.mkdir(tablesFolderPath, { recursive: true })
    await fs.mkdir(stateFolderPath, { recursive: true })
    const keyPath = path.resolve(path.join('tmp', 'keys', gitRepo.id))
    await createOrGetSshKeyPath({ keyPath, sshPrivateKey: gitRepo.sshPrivateKey ?? '' })
    const git = await initGitRepo(keyPath, gitRepo.remoteUrl, tmpFolder, gitRepo.branch)

    const user = await userService(log).getOneOrFail({
        id: userId,
    })
    const identity = await userIdentityService(log).getBasicInformation(user.identityId)
    const { email, firstName, lastName } = identity
    await git.addConfig('user.email', email)
    await git.addConfig('user.name', `${firstName} ${lastName}`)
    return {
        git,
        flowFolderPath,
        stateFolderPath,
        connectionsFolderPath,
        tablesFolderPath,
    }
}

async function createOrGetSshKeyPath({ keyPath, sshPrivateKey }: { keyPath: string, sshPrivateKey: string }): Promise<void> {
    await fs.mkdir(path.dirname(keyPath), { recursive: true })
    await fs.writeFile(keyPath, sshPrivateKey)
    await fs.chmod(keyPath, 0o600)
}

async function initGitRepo(
    keyPath: string,
    remoteUrl: string,
    baseDir: string,
    branch: string,
): Promise<SimpleGit> {
    const git = simpleGit({
        baseDir,
        binary: 'git',
    }).env('GIT_SSH_COMMAND', `ssh -i ${keyPath} -o StrictHostKeyChecking=no`)
    await git.init()
    await git.addConfig('core.symlinks', 'false')
    await git.addConfig('protocol.file.allow', 'never')
    await git.addRemote('origin', remoteUrl)
    await git.branch(['-M', branch])
    await git.pull('origin', branch)
    return git
}

const SAFE_SLUG_PATTERN = /^[A-Za-z0-9._-]{1,128}$/

function assertSafeSlug(slug: string): void {
    if (!SAFE_SLUG_PATTERN.test(slug) || slug === '.' || slug === '..') {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: `invalid gitRepo.slug "${slug}": only alphanumeric, dot, dash and underscore are allowed (max 128 chars)`,
            },
        })
    }
}

async function validateConnection(request: ConfigureRepoRequest): Promise<void> {
    const environment = system.getOrThrow<ApEnvironment>(AppSystemProp.ENVIRONMENT)
    if (environment === ApEnvironment.TESTING) {
        return
    }
    const { remoteUrl, sshPrivateKey, branch } = request

    const tmpFolder = path.join('/', 'tmp', 'repo', nanoid(), 'validate')
    const keyPath = path.resolve(path.join('tmp', 'keys', nanoid()))

    try {
        await fs.mkdir(tmpFolder, { recursive: true })
        await createOrGetSshKeyPath({ keyPath, sshPrivateKey })
        await initGitRepo(keyPath, remoteUrl, tmpFolder, branch)
    }
    catch (error) {
        throw new ActivepiecesError({
            code: ErrorCode.INVALID_GIT_CREDENTIALS,
            params: {
                message: (error as Error).message,
            },
        })
    }
    finally {
        await fs.rmdir(tmpFolder, { recursive: true })
        await fs.unlink(keyPath)
    }
}
