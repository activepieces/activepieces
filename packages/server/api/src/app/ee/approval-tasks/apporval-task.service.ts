import { repoFactory } from '../../core/db/repo-factory'
import { ApprovalTaskEntity } from './apporval-task.entity'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { Order } from '../../helper/pagination/paginator'
import {
    isNil,
    ProjectId,
    SeekPage,
} from '@activepieces/shared'
import { ApprovalTask } from '@activepieces/ee-shared'
import { FastifyBaseLogger } from 'fastify'


type ListParams = {
    projectId: ProjectId
    assignedUserId?: string
    limit?: number
    cursor?: string
}

const approvalTaskRepo = repoFactory(ApprovalTaskEntity)

export const approvalTaskService = (log: FastifyBaseLogger) => ({
    async list(params: ListParams): Promise<SeekPage<ApprovalTask>> {
        const decodedCursor = paginationHelper.decodeCursor(params.cursor ?? null)
        const paginator = buildPaginator<ApprovalTask>({
            entity: ApprovalTaskEntity,
            query: {
                limit: params.limit,
                order: Order.DESC,
                orderBy: 'created',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const query = approvalTaskRepo().createQueryBuilder('approval_task')
            .where('approval_task.projectId = :projectId', { projectId: params.projectId })

        if (!isNil(params.assignedUserId)) {
            query.andWhere('approval_task.assignedUserId = :assignedUserId', { assignedUserId: params.assignedUserId })
        }

        const { data, cursor: newCursor } = await paginator.paginate(query)
        return paginationHelper.createPage<ApprovalTask>(data, newCursor)
    },
    async getOne(params: { id: string }): Promise<ApprovalTask> {
        return await approvalTaskRepo().findOneByOrFail({ id: params.id })
    },
    async updateSelectedOption(params: { id: string, option: string }): Promise<ApprovalTask> {
        const approvalTask = await approvalTaskRepo().findOneByOrFail({ id: params.id })
        approvalTask.selectedOption = params.option
        return await approvalTaskRepo().save(approvalTask)
    }
})

