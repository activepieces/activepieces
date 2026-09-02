import { Readable } from 'node:stream'
import { FlowActionType, flowStructureUtil, FlowTrigger, FlowTriggerType, PrincipalType } from '@activepieces/shared'
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { StatusCodes } from 'http-status-codes'
import { securityAccess } from '../../core/security/authorization/fastify-security'
import { flowRepo } from '../../flows/flow/flow.repo'

const BATCH_SIZE = 200

const CSV_HEADER = [
    'projectId',
    'projectName',
    'flowId',
    'flowName',
    'flowStatus',
    'flowVersionId',
    'versionCreatedAt',
    'stepName',
    'stepType',
    'pieceName',
    'pieceVersion',
]

export const piecesReportController: FastifyPluginAsyncZod = async (app) => {
    app.get('/pieces-report.csv', PiecesReportRequest, async (req, reply) => {
        const platformId = req.principal.platform.id
        const today = new Date().toISOString().slice(0, 10)
        const filename = `pieces-report-${platformId}-${today}.csv`

        return reply
            .header('Content-Disposition', `attachment; filename="${filename}"`)
            .header('Cache-Control', 'no-store')
            .type('text/csv; charset=utf-8')
            .status(StatusCodes.OK)
            .send(Readable.from(csvStream(platformId)))
    })
}

async function* csvStream(platformId: string): AsyncIterable<string> {
    yield csvRow(CSV_HEADER)
    let cursor: string | undefined
    while (true) {
        const batch = await fetchBatch({ platformId, cursor, limit: BATCH_SIZE })
        if (batch.length === 0) {
            break
        }
        for (const row of batch) {
            for (const step of flowStructureUtil.getAllSteps(row.trigger)) {
                if (step.type !== FlowActionType.PIECE && step.type !== FlowTriggerType.PIECE) {
                    continue
                }
                yield csvRow([
                    row.projectId,
                    row.projectName,
                    row.flowId,
                    row.flowName,
                    row.flowStatus,
                    row.flowVersionId,
                    toIso(row.versionCreatedAt),
                    step.name,
                    step.type,
                    step.settings.pieceName,
                    step.settings.pieceVersion,
                ])
            }
        }
        cursor = batch[batch.length - 1].flowVersionId
    }
}

async function fetchBatch({ platformId, cursor, limit }: FetchBatchParams): Promise<FlowRow[]> {
    const qb = flowRepo().createQueryBuilder('flow')
        .innerJoin('flow_version', 'fv', 'fv.id = flow."publishedVersionId"')
        .innerJoin('project', 'p', 'p.id = flow."projectId"')
        .where('p."platformId" = :platformId', { platformId })
        .andWhere('flow."publishedVersionId" IS NOT NULL')
        .select([
            'flow."projectId" AS "projectId"',
            'p."displayName" AS "projectName"',
            'flow.id AS "flowId"',
            'fv."displayName" AS "flowName"',
            'flow.status AS "flowStatus"',
            'fv.id AS "flowVersionId"',
            'fv.created AS "versionCreatedAt"',
            'fv.trigger AS "trigger"',
        ])
        .orderBy('fv.id', 'ASC')
        .limit(limit)
    if (cursor !== undefined) {
        qb.andWhere('fv.id > :cursor', { cursor })
    }
    return qb.getRawMany<FlowRow>()
}

function csvRow(fields: (string | null | undefined)[]): string {
    return fields.map(csvField).join(',') + '\n'
}

function csvField(value: string | null | undefined): string {
    if (value === null || value === undefined) {
        return ''
    }
    const disarmed = CSV_FORMULA_LEADS.has(value[0]) ? `'${value}` : value
    const needsQuoting = /[",\r\n]/.test(disarmed)
    const escaped = disarmed.replace(/"/g, '""')
    return needsQuoting ? `"${escaped}"` : escaped
}

const CSV_FORMULA_LEADS = new Set(['=', '+', '-', '@', '\t', '\r'])

function toIso(value: Date | string): string {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

type FlowRow = {
    projectId: string
    projectName: string
    flowId: string
    flowName: string
    flowStatus: string
    flowVersionId: string
    versionCreatedAt: Date | string
    trigger: FlowTrigger
}

type FetchBatchParams = {
    platformId: string
    cursor: string | undefined
    limit: number
}

const PiecesReportRequest = {
    config: {
        security: securityAccess.platformAdminOnly([PrincipalType.USER]),
    },
}
