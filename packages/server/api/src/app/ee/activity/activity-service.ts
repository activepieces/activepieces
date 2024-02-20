import { Activity } from '@activepieces/ee-shared'
import { ProjectId, apId } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { ActivityEntity } from './activity-entity'

const repo = databaseConnection.getRepository(ActivityEntity)

export const activityService = {
    list(params: ListParams): Promise<Activity[]> {
        return repo.find({
            where: {
                projectId: params.projectId,
            },
            order: {
                created: 'DESC',
            },
        })
    },

    add(params: AddParams): Promise<Activity> {
        const newActivity: Activity = {
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            ...params,
        }

        return repo.save(newActivity)
    },
}

type ListParams = {
    projectId: ProjectId
}

type AddParams = {
    projectId: ProjectId
    event: string
    message: string
    status: string
}
