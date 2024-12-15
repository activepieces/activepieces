import { ActivepiecesError, ApId, apId, ErrorCode, FileId, ProjectId, ProjectVersion, SeekPage } from '@activepieces/shared'
import { Equal } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { ProjectVersionEntity } from './project-version.entity'
export const projectVersionRepo = repoFactory(ProjectVersionEntity)


export const projectVersionService = {
    async create(params: CreateProjectVersionParams): Promise<ProjectVersion> {
        const projectVersionExists = await projectVersionRepo().findOne({
            where: {
                fileId: Equal(params.fileId),
            },
        })
        if (projectVersionExists) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityType: 'project_version', entityId: params.fileId, message: 'Project Version already exists' },
            })
        }
        // TODO: uncomment this once we have a implement import project version
        // await fileService.getFileOrThrow({
        //     fileId: params.fileId,
        //     projectId: params.projectId,
        //     type: FileType.PROJECT_VERSION
        // })

        return projectVersionRepo().save({
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            projectId: params.projectId,
            importedAt: new Date().toISOString(),
            importedBy: params.importedBy,
            fileId: params.fileId,
        })
    },
    async list({ projectId }: ListParams): Promise<SeekPage<ProjectVersion>> {
        const projectVersions = await projectVersionRepo().find({
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
            data: await Promise.all(projectVersions.map(async (projectVersion) => {
                return {
                    ...projectVersion,
                }
            })),
            next: null,
            previous: null,
        }
    },
    async delete(params: DeleteProjectVersionParams): Promise<void> {
        await projectVersionRepo().delete({
            id: params.id,
            projectId: params.projectId,
        })
    },
}

type ListParams = {
    projectId: ProjectId
}

type CreateProjectVersionParams = {
    projectId: ProjectId
    fileId: FileId
    importedBy: ApId
}

type DeleteProjectVersionParams = {
    id: ApId
    projectId: ProjectId
}