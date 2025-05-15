import { AppSystemProp, rejectedPromiseHandler } from '@activepieces/server-shared'
import { ActivepiecesError, apId, ApId, Cursor, ErrorCode, isNil, McpWithPieces, SeekPage, spreadIfDefined, TelemetryEventName } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../core/db/repo-factory'
import { paginationHelper } from '../helper/pagination/pagination-utils'
import { telemetry } from '../helper/telemetry.utils'
import { McpEntity } from './mcp-entity'
import { mcpPieceService } from './mcp-piece-service'
import { buildPaginator } from '../helper/pagination/build-paginator'
import { system } from '../helper/system/system'
import { ILike } from 'typeorm'



const repo = repoFactory(McpEntity)

export const mcpService = (_log: FastifyBaseLogger) => ({

    async create({ projectId, name }: CreateParams): Promise<McpWithPieces> {
        await this.validateCount({ projectId })
        const mcp = await repo().save({
            id: apId(),
            projectId,
            name,
            token: apId(),
            created: dayjs().toISOString(),
            updated: dayjs().toISOString(),
        })
        return this.getOrThrow({ mcpId: mcp.id })
    },

    async list({ projectId, cursorRequest, limit, name }: ListParams): Promise<SeekPage<McpWithPieces>> {
        const decodedCursor = paginationHelper.decodeCursor(cursorRequest)

        const paginator = buildPaginator({
            entity: McpEntity,
            query: {
                limit,
                order: 'DESC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const queryWhere: Record<string, unknown> = { projectId }
        if (!isNil(name)) {
            queryWhere.name = ILike(`%${name}%`)
        }

        const queryBuilder = repo().createQueryBuilder('mcp').where(queryWhere)


        const { data, cursor } = await paginator.paginate(queryBuilder)


        const populatedMcpPromises = data.map(async (mcp) => {
            const mcpWithPieces = await this.getOrThrow({
                mcpId: mcp.id,
            })
            return mcpWithPieces
        })

        const populatedMcps = await Promise.all(populatedMcpPromises)
        return paginationHelper.createPage(populatedMcps, cursor)
    },

    async getOrThrow({ mcpId }: { mcpId: string }): Promise<McpWithPieces> {
        const mcp = await repo().findOneBy({ id: mcpId })

        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: mcpId, entityType: 'MCP' },
            })
        }
        return {
            ...mcp,
            pieces: await mcpPieceService(_log).list(mcp.id),
        }
    },

    async getByToken({ token }: { token: string }): Promise<McpWithPieces> {
        const mcp = await repo().findOne({ where: { token } })
        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: token, entityType: 'MCP' },
            })
        }
        return this.getOrThrow({ mcpId: mcp.id })
    },

    async update({ mcpId, token, name }: UpdateParams): Promise<McpWithPieces> {
        await repo().update(mcpId, {
            ...spreadIfDefined('token', token),
            ...spreadIfDefined('name', name),
            updated: dayjs().toISOString(),
        })

        return this.getOrThrow({ mcpId })
    },

    async trackToolCall({ mcpId, toolName }: { mcpId: ApId, toolName: string }): Promise<void> {
        const mcp = await repo().findOneBy({ id: mcpId })
        if (isNil(mcp)) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: mcpId, entityType: 'MCP' },
            })
        }
        rejectedPromiseHandler(telemetry(_log).trackProject(mcp.projectId, {
            name: TelemetryEventName.MCP_TOOL_CALLED,
            payload: {
                mcpId,
                toolName,
            },
        }), _log)
    },

    async delete({ mcpId, projectId }: { mcpId: ApId, projectId: ApId }): Promise<void> {
        const deleteResult = await repo().delete({ 
            id: mcpId,
            projectId,
        });

        if (deleteResult.affected === 0) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: { entityId: mcpId, entityType: 'MCP' },
            });
        }
    },

    async count({ projectId }: CountParams): Promise<number> {
        return repo().count({
            where: { projectId },
        })
    },
    async validateCount(params: CountParams): Promise<void> {
        const countRes = await this.count(params)
        if (countRes > system.getNumberOrThrow(AppSystemProp.MAX_MCPS_PER_PROJECT)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `Max mcps per project reached: ${system.getNumberOrThrow(AppSystemProp.MAX_MCPS_PER_PROJECT)}`,
                },
            })
        }
    },
})


type CreateParams = {
    projectId: ApId
    name: string
}


type ListParams = {
    projectId: ApId
    cursorRequest: Cursor | null
    limit: number
    name: string | undefined
}

type UpdateParams = {
    mcpId: ApId
    token?: string
    name?: string
}

type CountParams = {
    projectId: ApId
}
