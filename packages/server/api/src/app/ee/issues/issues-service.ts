import dayjs from 'dayjs'
import { databaseConnection } from '../../database/database-connection'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { telemetry } from '../../helper/telemetry.utils'
import { emailService } from '../helper/email/email-service'
import { IssueEntity } from './issues-entity'
import { Issue, IssueStatus, ListIssuesParams, PopulatedIssue } from '@activepieces/ee-shared'
import { rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, ApId, apId, ErrorCode, isNil, SeekPage, spreadIfDefined, TelemetryEventName } from '@activepieces/shared'
const repo = databaseConnection.getRepository(IssueEntity)

export const issuesService = {
    async add({ projectId, flowId }: { flowId: string, projectId: string }): Promise<void> {
        const issueId = apId()
        const date = dayjs().toISOString()
        await repo.createQueryBuilder()
            .insert()
            .into(IssueEntity)
            .values({
                projectId,
                flowId,
                id: issueId,
                lastOccurrence: date,
                count: 0,
                status: IssueStatus.ONGOING,
                created: date,
                updated: date,
            })
            .orIgnore()
            .execute()

        const updatedIssue = await this.update({
            projectId,
            flowId,
            status: IssueStatus.ONGOING,
        })

        if (updatedIssue.count === 1) {
            const flowVersion = await flowVersionService.getLatestLockedVersionOrThrow(flowId)
            await emailService.sendIssueCreatedNotification({
                projectId,
                flowName: flowVersion.displayName,
                count: updatedIssue.count,
                lastSeenAt: dayjs(updatedIssue.lastOccurrence).format('DD MMM YYYY, HH:mm'),
                createdAt: dayjs(date).format('DD MMM YYYY, HH:mm'),
            })
        }
    },
    async get({ projectId, flowId }: { projectId: string, flowId: string }): Promise<Issue | null> {
        return repo.findOneBy({
            projectId,
            flowId,
        })
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
            status: IssueStatus.ONGOING,
        })

        const { data, cursor: newCursor } = await paginator.paginate(query)

        const populatedIssues = await Promise.all(data.map(async issue => {
            const flowVersion = await flowVersionService.getLatestLockedVersionOrThrow(issue.flowId)
            return {
                ...issue,
                flowDisplayName: flowVersion.displayName,
            }
        }))
        return paginationHelper.createPage<PopulatedIssue>(populatedIssues, newCursor)
    },

    async updateById({ projectId, id, status }: UpdateParams): Promise<void> {
        const flowIssue = await repo.findOneBy({
            id,
            projectId,
        })
        if (isNil(flowIssue)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    message: 'issue not found',
                },
            })
        }
        rejectedPromiseHandler(telemetry.trackProject(flowIssue.projectId, {
            name: TelemetryEventName.FLOW_ISSUE_RESOLVED,
            payload: {
                flowId: flowIssue.flowId,
            },
        }))
        await repo.update({
            id,
        }, {
            status,
            updated: new Date().toISOString(),
            count: 0,
        })
    },
    async update({ projectId, flowId, status }: {
        projectId: ApId
        flowId: ApId
        status: IssueStatus
    }): Promise<Issue> {
        if (status != IssueStatus.RESOLEVED) {
            await repo.increment({ projectId, flowId }, 'count', 1)
        }
        await repo.update({
            projectId,
            flowId,
        }, {
            ...spreadIfDefined('lastOccurrence', status !== IssueStatus.RESOLEVED ? dayjs().toISOString() : undefined),
            ...spreadIfDefined('count', status === IssueStatus.RESOLEVED ? 0 : undefined),
            status,
            updated: new Date().toISOString(),
        })
        return repo.findOneByOrFail({
            projectId,
            flowId,
        })
    },
    async count({ projectId }: { projectId: ApId }): Promise<number> {
        return repo.count({
            where: {
                projectId,
                status: IssueStatus.ONGOING,
            },
        })
    },
}

type UpdateParams = {
    projectId: string
    id: string
    status: IssueStatus
}