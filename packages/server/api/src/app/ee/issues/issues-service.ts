import { databaseConnection } from '../../database/database-connection'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { Issue, ListIssuesParams, UpdateIssueRequest, IssueStatus, PopulatedIssue } from '@activepieces/ee-shared'
import { apId, SeekPage, isNil, ActivepiecesError, ErrorCode, spreadIfDefined } from '@activepieces/shared'
import { IssueEntity } from './issues-entity'
import dayjs from 'dayjs'
import { flowService } from '../../flows/flow/flow.service'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
const repo = databaseConnection.getRepository(IssueEntity)

export const issuesService = {
    async add({ projectId, flowId }: { flowId: string, projectId: string }): Promise<void> {
        await repo.createQueryBuilder()
            .insert()
            .into(IssueEntity)
            .values({
                projectId,
                flowId,
                id: apId(),
                lastSeen: dayjs().toISOString(),
                count: 0,
                status: IssueStatus.ONGOING,
                created: dayjs().toISOString(),
                updated: dayjs().toISOString(),
            })
            .orIgnore()
            .execute();

        await this.update({
            projectId: projectId,
            flowId: flowId,
            status: IssueStatus.ONGOING,
        })
    },
    async get(projectId: string, flowId: string): Promise<Issue | null> {
        return repo.findOneBy({
            projectId: projectId,
            flowId: flowId,
        })
    },

    async getOrThrow(projectId: string, flowId: string): Promise<Issue> {
        const issue = await repo.findOneBy({
            projectId: projectId,
            flowId: flowId,
        })
        if (isNil(issue)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: `issue not found`,
                },
            })
        }
        return issue
    },
    async list({ projectId, cursor, limit }: ListIssuesParams): Promise<SeekPage<PopulatedIssue>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor ?? null)
        const paginator = buildPaginator({
            entity: IssueEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const query = repo.createQueryBuilder(IssueEntity.options.name).where({
            projectId,
        })

        const { data, cursor: newCursor } = await paginator.paginate(query)

        const populatedIssues = await Promise.all(data.map(async issue => {
            const flowVersion = await flowVersionService.getLatestLockedVersionOrThrow(issue.flowId);
            return {
                ...issue,
                flowDisplayName: flowVersion.displayName,
            }
        }))
        return paginationHelper.createPage<PopulatedIssue>(populatedIssues, newCursor)
    },

    // Updates the status of the issue and updates the coloumns `count` and `lastSeen` accordingly.
    async update({ projectId, flowId, status }: UpdateIssueRequest): Promise<void> {
        if (status != IssueStatus.RESOLEVED) {
            await repo.increment({ projectId, flowId }, 'count', 1);
        }
        await repo.update({
            projectId,
            flowId,
        }, {
            ...spreadIfDefined('lastSeen', status !== IssueStatus.RESOLEVED ? dayjs().toISOString() : undefined),
            ...spreadIfDefined('count', status === IssueStatus.RESOLEVED ? 0 : undefined),
            status,
            updated: new Date().toISOString(),
        })
    },
}