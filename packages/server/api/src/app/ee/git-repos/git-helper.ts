import fs from 'fs/promises'
import path from 'path'
import simpleGit, { SimpleGit } from 'simple-git'
import { userService } from '../../user/user-service'
import { GitRepo } from '@activepieces/ee-shared'

export const gitHelper = {
    commitAndPush,
    createGitRepoAndReturnPaths,
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
