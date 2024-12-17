import { ActivepiecesError, ApId, apId, ErrorCode, FileId, ProjectId, ProjectRelease, SeekPage } from '@activepieces/shared'
import { Equal } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { ProjectReleaseEntity } from './project-release.entity'
export const projectReleaseRepo = repoFactory(ProjectReleaseEntity)


export const projectReleaseService = {
    async create(params: CreateProjectReleaseParams): Promise<ProjectRelease> {
        // TODO: uncomment this once we have a implement import project version
        // await fileService.getFileOrThrow({
        //     fileId: params.fileId,
        //     projectId: params.projectId,
        //     type: FileType.PROJECT_VERSION
        // })

        return projectReleaseRepo().save({
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            projectId: params.projectId,
            importedAt: new Date().toISOString(),
            importedBy: params.importedBy,
            fileId: params.fileId,
            name: params.name,
            description: params.description,
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
                return {
                    ...projectRelease,
                }
            })),
            next: null,
            previous: null,
        }
    },
    async delete(params: DeleteProjectReleaseParams): Promise<void> {
        await projectReleaseRepo().delete({
            id: params.id,
            projectId: params.projectId,
        })
    },
}

type ListParams = {
    projectId: ProjectId
}

type CreateProjectReleaseParams = {
    projectId: ProjectId
    fileId: FileId
    importedBy: ApId
    name: string
    description: string | null
}

type DeleteProjectReleaseParams = {
    id: ApId
    projectId: ProjectId
}