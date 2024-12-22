import { ActivepiecesError, ApId, apId, ErrorCode, FileCompression, FileId, FileType, isNil, ListProjectReleasesRequest, ProjectId, ProjectRelease, ProjectReleaseType, SeekPage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { fileService } from '../../file/file.service'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowService } from '../../flows/flow/flow.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { userService } from '../../user/user-service'
import { gitRepoService } from './git-sync/git-sync.service'
import { ProjectReleaseEntity } from './project-release.entity'

const projectReleaseRepo = repoFactory(ProjectReleaseEntity)

export const projectReleaseService = {
    async create(params: CreateProjectReleaseParams): Promise<ProjectRelease> {
        const gitRepo = await gitRepoService(params.log).getOneByProjectOrThrow({ projectId: params.projectId })
        await gitRepoService(params.log).pull({
            gitRepo,
            userId: params.importedBy,
            dryRun: false,
            selectedOperations: params.selectedOperations,
        })
        const fileId = await saveFlowsData(params.projectId, params.name, params.log)
        const projectRelease: ProjectRelease = {
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            projectId: params.projectId,
            importedBy: params.importedBy,
            fileId,
            name: params.name,
            description: params.description,
            type: params.type,
        }
        return projectReleaseRepo().save(projectRelease)
    },
    async list({ projectId, request }: ListParams): Promise<SeekPage<ProjectRelease>> {
        const decodedCursor = paginationHelper.decodeCursor(request.cursor ?? null)
        const paginator = buildPaginator({
            entity: ProjectReleaseEntity,
            query: {
                limit: request.limit ?? 10,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })
        const { data, cursor } = await paginator.paginate(projectReleaseRepo()
            .createQueryBuilder('project_release')
            .where({
                projectId,
            }))
        const enrichedData = await Promise.all(data.map(async (projectRelease) => ({
            ...projectRelease,
            importedByUser: isNil(projectRelease.importedBy) ? undefined : await userService.getMetaInfo({
                id: projectRelease.importedBy,
            }) ?? undefined,
        })))
        return paginationHelper.createPage<ProjectRelease>(enrichedData, cursor)
    },
    async getOneOrThrow(params: GetOneProjectReleaseParams): Promise<ProjectRelease> {
        const projectRelease = await projectReleaseRepo().findOneBy({
            id: params.id,
            projectId: params.projectId,
        })
        if (isNil(projectRelease)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityId: params.id,
                },
            })
        }
        return projectRelease
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
    request: ListProjectReleasesRequest
}

type GetOneProjectReleaseParams = {
    id: ApId
    projectId: ProjectId
}

type CreateProjectReleaseParams = {
    projectId: ProjectId
    importedBy: ApId
    name: string
    description: string | null | undefined
    log: FastifyBaseLogger
    type: ProjectReleaseType
    selectedOperations: string[]
    repoId: string
}
