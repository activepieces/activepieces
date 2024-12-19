import { ActivepiecesError, ApId, apId, ErrorCode, FileCompression, FileId, FileType, isNil, ProjectId, ProjectRelease, ProjectReleaseType, SeekPage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { Equal } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { fileService } from '../../file/file.service'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowService } from '../../flows/flow/flow.service'
import { userService } from '../../user/user-service'
import { gitRepoService } from '../git-sync/git-sync.service'
import { ProjectReleaseEntity } from './project-release.entity'

const projectReleaseRepo = repoFactory(ProjectReleaseEntity)


export const projectReleaseService = {
    async create(params: CreateProjectReleaseParams): Promise<ProjectRelease> {
        if (params.type !== ProjectReleaseType.GIT) {
            throw new ActivepiecesError({
                code: ErrorCode.INVALID_RELEASE_TYPE,
                params: {
                    message: 'Invalid project release type',
                },
            })
        }
        const gitRepo = await gitRepoService(params.log).getOneByProjectOrThrow({ projectId: params.projectId })
        await gitRepoService(params.log).pull({
            gitRepo,
            userId: params.importedBy,
            dryRun: false,
            selectedOperations: params.selectedOperations,
        })
        const fileId = await saveFlowsData(params.projectId, params.name, params.log)

        return projectReleaseRepo().save({
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            projectId: params.projectId,
            importedAt: new Date().toISOString(),
            importedBy: params.importedBy,
            fileId,
            name: params.name,
            description: params.description,
            type: params.type,
        })
    },
    async list({ projectId }: ListParams): Promise<SeekPage<ProjectRelease>> {
        const projectReleases = await projectReleaseRepo().find({
            where: [
                {
                    projectId: Equal(projectId),
                },
            ],
            order: {
                created: 'ASC',
            },
        })

        return {
            data: await Promise.all(projectReleases.map(async (projectRelease) => {
                if (isNil(projectRelease.importedBy)) {
                    return {
                        ...projectRelease,
                        importedBy: null,
                    }
                }
                const user = await userService.getMetaInfo({
                    id: projectRelease.importedBy,
                })
                return {
                    ...projectRelease,
                    importedBy: user ? user.email : null,
                }
            })),
            next: null,
            previous: null,
        }
    },
    async rollback(params: RollbackProjectReleaseParams): Promise<void> {
        const projectRelease = await projectReleaseRepo().findOneByOrFail({
            id: params.id,
            projectId: params.projectId,
        })
        const file = await fileService(params.log).getDataOrThrow({
            fileId: projectRelease.fileId,
            projectId: projectRelease.projectId,
            type: FileType.PROJECT_RELEASE,
        })
        const flows = JSON.parse(file.data.toString())
        const allProjectFlows = await flowRepo().find({
            where: {
                projectId: projectRelease.projectId,
            },
        })
        for (const deleteFlow of allProjectFlows) {
            await flowService(params.log).delete({
                id: deleteFlow.id,
                projectId: projectRelease.projectId,
            })
        }
        for (const flow of flows) {
            await flowRepo().save({
                ...flow,
                projectId: projectRelease.projectId,
            })
        }
    },
    async download(params: DownloadProjectReleaseParams): Promise<Buffer> {
        const projectRelease = await projectReleaseRepo().findOneByOrFail({
            id: params.id,
            projectId: params.projectId,
        })
        const file = await fileService(params.log).getDataOrThrow({
            fileId: projectRelease.fileId,
            projectId: projectRelease.projectId,
            type: FileType.PROJECT_RELEASE,
        })
        return file.data
    },
}

async function saveFlowsData(projectId: ProjectId, name: string, log: FastifyBaseLogger): Promise<FileId> {
    const flows = await flowRepo().find({
        where: {
            projectId,
        },
    })
    const allPopulatedFlows = await Promise.all(flows.map(async (flow) => {
        return flowService(log).getOnePopulatedOrThrow({
            id: flow.id,
            projectId,
        })
    }))
    const flowsData = JSON.stringify(allPopulatedFlows)
    const fileData = Buffer.from(flowsData)

    const file = await fileService(log).save({
        projectId,
        type: FileType.PROJECT_RELEASE,
        fileName: `${name}.json`,
        size: fileData.byteLength,
        data: fileData,
        compression: FileCompression.NONE,
    })

    return file.id
}

type ListParams = {
    projectId: ProjectId
}

type CreateProjectReleaseParams = {
    projectId: ProjectId
    importedBy: ApId
    name: string
    description: string | null
    log: FastifyBaseLogger
    type: ProjectReleaseType
    selectedOperations: string[]
    repoId: string
}

type RollbackProjectReleaseParams = {
    id: ApId
    projectId: ProjectId
    log: FastifyBaseLogger
}

type DownloadProjectReleaseParams = {
    id: ApId
    projectId: ProjectId
    log: FastifyBaseLogger
}