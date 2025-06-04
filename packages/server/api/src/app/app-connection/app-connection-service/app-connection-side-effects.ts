// import { GitPushOperationType } from '@activepieces/ee-shared'
import { FastifyBaseLogger } from 'fastify'
// import { gitRepoService } from '../../ee/projects/project-release/git-sync/git-sync.service'

export const appConnectionSideEffects = (log: FastifyBaseLogger) => ({
    async onDeleted(params: OnDeletedParams): Promise<void> {
        // await gitRepoService(log).onDeleted({
        //     type: GitPushOperationType.DELETE_CONNECTION,
        //     idOrExternalId: params.externalId,
        //     userId: params.userId,
        //     projectId: params.projectId,
        //     platformId: params.platformId,
        //     log,
        // })
    },
})

type OnDeletedParams = {
    externalId: string
    userId: string
    projectId: string
    platformId: string
}
