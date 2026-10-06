import { agentToolClassification, FlowActionType, FlowOperationType, flowStructureUtil, PackageType, PieceType, ProjectScopedMcpServer } from '@activepieces/shared'
import { FastifyBaseLogger, FastifyInstance } from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { flowService } from '../../../../src/app/flows/flow/flow.service'
import { apBuildFlowTool } from '../../../../src/app/mcp/tools/ap-build-flow'
import { apCreateFolderTool } from '../../../../src/app/mcp/tools/ap-create-folder'
import { apCreateTableTool } from '../../../../src/app/mcp/tools/ap-create-table'
import { apValidateFlowTool } from '../../../../src/app/mcp/tools/ap-validate-flow'
import { projectService } from '../../../../src/app/project/project-service'
import { db } from '../../../helpers/db'
import { mockProjectScopedMcpServer } from '../../../helpers/mcp-flow'
import { createMockPieceMetadata } from '../../../helpers/mocks'
import { createTestContext } from '../../../helpers/test-context'
import { setupTestEnvironment, teardownTestEnvironment } from '../../../helpers/test-setup'

let app: FastifyInstance
let log: FastifyBaseLogger

beforeAll(async () => {
    app = await setupTestEnvironment()
    log = app.log
    await db.save('piece_metadata', createMockPieceMetadata({
        name: '@activepieces/piece-subflows',
        displayName: 'Sub Flows',
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        actions: {
            callFlow: {
                name: 'callFlow',
                displayName: 'Call Flow',
                description: 'Call a flow',
                requireAuth: false,
                props: {
                    flowId: { type: 'SHORT_TEXT', displayName: 'Flow', required: false },
                    mode: { type: 'SHORT_TEXT', displayName: 'Mode', required: false },
                    flowProps: { type: 'JSON', displayName: 'Flow props', required: false },
                    waitForResponse: { type: 'CHECKBOX', displayName: 'Wait for Response', required: false },
                },
            },
            returnResponse: {
                name: 'returnResponse',
                displayName: 'Return Response',
                description: 'Return a response',
                requireAuth: false,
                props: {
                    mode: { type: 'SHORT_TEXT', displayName: 'Mode', required: false },
                    response: { type: 'JSON', displayName: 'Response', required: false },
                },
            },
        },
        triggers: {
            callableFlow: {
                name: 'callableFlow',
                displayName: 'Callable Flow',
                description: 'Called by another flow',
                requireAuth: false,
                props: {
                    mode: { type: 'SHORT_TEXT', displayName: 'Mode', required: false },
                    exampleData: { type: 'JSON', displayName: 'Sample data', required: false },
                },
            },
        },
    }))
    await db.save('piece_metadata', createMockPieceMetadata({
        name: '@activepieces/piece-tables',
        displayName: 'Tables',
        version: '0.1.0',
        pieceType: PieceType.OFFICIAL,
        packageType: PackageType.REGISTRY,
        platformId: undefined,
        actions: {
            'tables-create-records': {
                name: 'tables-create-records',
                displayName: 'Create Records',
                description: 'Create records',
                requireAuth: false,
                props: {
                    table_id: { type: 'SHORT_TEXT', displayName: 'Table', required: false },
                    values: { type: 'JSON', displayName: 'Values', required: false },
                    records: { type: 'JSON', displayName: 'Records', required: false },
                },
            },
        },
        triggers: {
            newRecord: {
                name: 'newRecord',
                displayName: 'New Record',
                description: 'A record was created',
                requireAuth: false,
                props: {
                    table_id: { type: 'SHORT_TEXT', displayName: 'Table', required: false },
                },
            },
        },
    }))
})

afterAll(async () => {
    await teardownTestEnvironment()
})

describe('ap_validate_flow with folderName', () => {
    it('passes a solution whose subflow, call and table all fit together', async () => {
        const { mcp, table } = await createSolutionBase()
        const subflow = await buildSubflow({ mcp, withResponse: true, writeField: table.fieldExternalId, tableExternalId: table.externalId })
        await buildCaller({ mcp, subflowExternalId: subflow.externalId, payload: { orderId: '{{trigger.data.id}}' }, waitForResponse: true })

        const result = await apValidateFlowTool({ mcp }, log).execute({ folderName: SOLUTION_FOLDER })
        const report = structured(result)

        expect(report.flowCount).toBe(2)
        expect(report.issues).toEqual([])
        expect(report.ok).toBe(true)
        expect(text(result)).toContain('every connection checks out')
    })

    it('reports a subflow that reads its inputs from outside data, which are empty at run time', async () => {
        const { mcp, table } = await createSolutionBase()
        await buildSubflow({ mcp, withResponse: false, writeField: table.fieldExternalId, tableExternalId: table.externalId, inputRef: '{{trigger.orderId}}' })

        const messages = await issueMessages(mcp)

        expect(messages).toContainEqual(expect.stringContaining("A Callable Flow puts its inputs under data: {{trigger['output'].orderId}} → {{trigger['output'].data.orderId}}"))
    })

    it.each([
        { spelling: '{{trigger.output.orderId}}' },
        { spelling: '{{trigger["output"]["orderId"]}}' },
    ])('reports a subflow input read outside data in a builder-saved spelling: $spelling', async ({ spelling }) => {
        const { mcp, table } = await createSolutionBase()
        const subflow = await buildSubflow({ mcp, withResponse: false, writeField: table.fieldExternalId, tableExternalId: table.externalId })
        const { data: [flow] } = await flowService(log).list({ projectIds: [mcp.projectId], externalIds: [subflow.externalId], includeTriggerSource: false })
        const step = flowStructureUtil.getStepOrThrow('step_1', flow.version.trigger)
        const { platformId } = await projectService(log).getOneOrThrow(mcp.projectId)
        await flowService(log).update({
            id: flow.id, projectId: mcp.projectId, userId: null, platformId,
            operation: { type: FlowOperationType.UPDATE_ACTION, request: { ...step, settings: { ...step.settings, input: { table_id: table.externalId, values: { values: [{ [table.fieldExternalId]: spelling }] } } } } },
        })

        const messages = await issueMessages(mcp)

        expect(messages).toContainEqual(expect.stringContaining("{{trigger['output'].data.orderId}}"))
    })

    it('reports a Call Flow that sends its payload as JSON text, which the subflow receives as one string', async () => {
        const { mcp, table } = await createSolutionBase()
        const subflow = await buildSubflow({ mcp, withResponse: false, writeField: table.fieldExternalId, tableExternalId: table.externalId })
        await buildFlow({ mcp, flowName: 'Receive order', steps: [
            { type: FlowActionType.PIECE, displayName: 'Enrich', pieceName: '@activepieces/piece-subflows', actionName: 'callFlow', input: { flowId: subflow.externalId, mode: 'advanced', flowProps: { payload: '{"orderId": "{{trigger.data.id}}"}' }, waitForResponse: false } },
        ] })

        const messages = await issueMessages(mcp)

        expect(messages).toContainEqual(expect.stringContaining('sends its payload as JSON text'))
        expect(messages).not.toContainEqual(expect.stringContaining('does not send'))
    })

    it('accepts a JSON-text payload when the subflow parses its data itself', async () => {
        const { mcp, table } = await createSolutionBase()
        const subflow = await buildSubflow({ mcp, withResponse: false, writeField: table.fieldExternalId, tableExternalId: table.externalId, inputRef: '{{trigger.data}}' })
        await buildFlow({ mcp, flowName: 'Receive order', steps: [
            { type: FlowActionType.PIECE, displayName: 'Enrich', pieceName: '@activepieces/piece-subflows', actionName: 'callFlow', input: { flowId: subflow.externalId, mode: 'advanced', flowProps: { payload: '{"orderId": "{{trigger.data.id}}"}' }, waitForResponse: false } },
        ] })

        const messages = await issueMessages(mcp)

        expect(messages).not.toContainEqual(expect.stringContaining('JSON text'))
    })

    it('reports a call that misses a subflow input and waits for a response the subflow never returns', async () => {
        const { mcp, table } = await createSolutionBase()
        const subflow = await buildSubflow({ mcp, withResponse: false, writeField: table.fieldExternalId, tableExternalId: table.externalId })
        await buildCaller({ mcp, subflowExternalId: subflow.externalId, payload: { customer: 'x' }, waitForResponse: true })

        const messages = await issueMessages(mcp)

        expect(messages).toContainEqual(expect.stringContaining('does not send orderId'))
        expect(messages).toContainEqual(expect.stringContaining('has no Return Response step'))
        const report = text(await apValidateFlowTool({ mcp }, log).execute({ folderName: SOLUTION_FOLDER }))
        expect(report).toContain('"Receive order" › "Enrich"')
        expect(agentToolClassification.hasFailureTextPrefix(report)).toBe(false)
    })

    it('reports a call to a flow that does not exist and a table step with an unknown table or field', async () => {
        const { mcp, table } = await createSolutionBase()
        await buildSubflow({ mcp, withResponse: true, writeField: 'not_a_field', tableExternalId: table.externalId })
        await buildCaller({ mcp, subflowExternalId: 'missing-flow', payload: { orderId: '1' }, waitForResponse: false })
        await apBuildFlowTool({ mcp }, log).execute({
            flowName: 'Watch orders',
            folderName: SOLUTION_FOLDER,
            trigger: { pieceName: '@activepieces/piece-tables', triggerName: 'newRecord', input: { table_id: 'missing-table' } },
            steps: [],
        })

        const messages = await issueMessages(mcp)

        expect(messages).toContainEqual(expect.stringContaining('writes fields table "Orders" does not have: not_a_field'))
        expect(messages).toContainEqual(expect.stringContaining(`Valid fields: "Order id" → ${table.fieldExternalId}`))
        expect(messages).toContainEqual(expect.stringContaining('targets a flow that does not exist'))
        expect(messages).toContainEqual(expect.stringContaining('points at a table that does not exist'))
    })

    it('reports a table trigger with no table selected', async () => {
        const { mcp } = await createSolutionBase()
        await apBuildFlowTool({ mcp }, log).execute({
            flowName: 'Watch orders',
            folderName: SOLUTION_FOLDER,
            trigger: { pieceName: '@activepieces/piece-tables', triggerName: 'newRecord', input: {} },
            steps: [],
        })

        const messages = await issueMessages(mcp)

        expect(messages).toContainEqual(expect.stringContaining('table trigger has no table selected'))
    })

    it('tells a table step set to the table internal id which externalId to use', async () => {
        const { mcp, table } = await createSolutionBase()
        await buildSubflow({ mcp, withResponse: true, writeField: table.fieldExternalId, tableExternalId: table.id })

        const messages = await issueMessages(mcp)

        expect(messages).toContainEqual(expect.stringContaining(`internal id; the Tables piece needs its externalId: set table_id to ${table.externalId}`))
    })

    it('reports a call with no payload and a string "true" wait, as the action treats them', async () => {
        const { mcp, table } = await createSolutionBase()
        const subflow = await buildSubflow({ mcp, withResponse: false, writeField: table.fieldExternalId, tableExternalId: table.externalId })
        await buildFlow({ mcp, flowName: 'Receive order', steps: [{ type: FlowActionType.PIECE, displayName: 'Enrich', pieceName: '@activepieces/piece-subflows', actionName: 'callFlow', input: { flowId: subflow.externalId, mode: 'simple', flowProps: {}, waitForResponse: 'true' } }] })

        const messages = await issueMessages(mcp)

        expect(messages).toContainEqual(expect.stringContaining('does not send orderId'))
        expect(messages).toContainEqual(expect.stringContaining('has no Return Response step'))
    })

    it('checks a single raw record object and skips a table chosen by expression', async () => {
        const { mcp, table } = await createSolutionBase()
        await buildFlow({ mcp, flowName: 'Store orders', steps: [
            { type: FlowActionType.PIECE, displayName: 'Save raw', pieceName: '@activepieces/piece-tables', actionName: 'tables-create-records', input: { table_id: table.externalId, records: '{"Order id": "1", "Customer": "x"}' } },
            { type: FlowActionType.PIECE, displayName: 'Save dynamic', pieceName: '@activepieces/piece-tables', actionName: 'tables-create-records', input: { table_id: '{{trigger.data.tableId}}', values: { values: [] } } },
        ] })

        const report = structured(await apValidateFlowTool({ mcp }, log).execute({ folderName: SOLUTION_FOLDER }))
        const messages = report.issues.map((issue) => issue.message)

        expect(messages).toContainEqual(expect.stringContaining('writes fields table "Orders" does not have: Customer'))
        expect(messages.filter((message) => message.includes('does not exist'))).toEqual([])
        expect(report.ok).toBe(false)
        expect(report.unchecked).toContainEqual(expect.objectContaining({ message: expect.stringContaining('table is set by an expression') }))
    })

    it('marks a Call Flow whose target is an expression as unchecked, never as verified', async () => {
        const { mcp } = await createSolutionBase()
        await buildCaller({ mcp, subflowExternalId: '{{trigger.data.flow}}', payload: {}, waitForResponse: true })

        const result = await apValidateFlowTool({ mcp }, log).execute({ folderName: SOLUTION_FOLDER })

        expect(structured(result).ok).toBe(false)
        expect(text(result)).toContain('could not be checked')
        expect(text(result)).not.toContain('every connection checks out')
    })

    it('reports the template and branch problems ap_validate_flow finds', async () => {
        const { mcp } = await createSolutionBase()
        await buildFlow({ mcp, flowName: 'Broken reference', steps: [{ type: FlowActionType.CODE, displayName: 'Use missing step', sourceCode: 'export const code = async (inputs) => inputs', input: { value: '{{missing_step[\'output\'].id}}' } }] })

        const messages = await issueMessages(mcp)

        expect(messages).toContainEqual(expect.stringContaining('missing_step'))
    })

    it('asks for exactly one of flowId or folderName', async () => {
        const { mcp } = await createSolutionBase()

        const both = await apValidateFlowTool({ mcp }, log).execute({ flowId: 'any', folderName: SOLUTION_FOLDER })
        const neither = await apValidateFlowTool({ mcp }, log).execute({})

        expect(text(both)).toContain('Pass exactly one of flowId')
        expect(text(neither)).toContain('Pass exactly one of flowId')
    })

    it('asks for ap_create_folder when the folder does not exist', async () => {
        const ctx = await createTestContext(app)

        const result = await apValidateFlowTool({ mcp: mockProjectScopedMcpServer(ctx) }, log).execute({ folderName: 'Nowhere' })

        expect(text(result)).toContain('ap_create_folder')
    })
})

async function createSolutionBase(): Promise<{ mcp: ProjectScopedMcpServer, table: { id: string, externalId: string, fieldExternalId: string } }> {
    const ctx = await createTestContext(app)
    const mcp = mockProjectScopedMcpServer(ctx)
    await apCreateFolderTool(mcp, log).execute({ folderName: SOLUTION_FOLDER })
    const created = await apCreateTableTool(mcp, log).execute({ name: 'Orders', folderName: SOLUTION_FOLDER, fields: [{ name: 'Order id', type: 'TEXT' }] })
    const table = z.object({ id: z.string(), externalId: z.string(), fields: z.array(z.object({ externalId: z.string() })) }).parse(created.structuredContent)
    return { mcp, table: { id: table.id, externalId: table.externalId, fieldExternalId: table.fields[0].externalId } }
}

async function buildSubflow({ mcp, withResponse, writeField, tableExternalId, inputRef = '{{trigger.data.orderId}}' }: { mcp: ProjectScopedMcpServer, withResponse: boolean, writeField: string, tableExternalId: string, inputRef?: string }): Promise<{ externalId: string }> {
    const result = await apBuildFlowTool({ mcp }, log).execute({
        flowName: 'Enrich order',
        folderName: SOLUTION_FOLDER,
        trigger: { pieceName: '@activepieces/piece-subflows', triggerName: 'callableFlow', input: { mode: 'simple', exampleData: { sampleData: { orderId: '123' } } } },
        steps: [
            { type: FlowActionType.PIECE, displayName: 'Save order', pieceName: '@activepieces/piece-tables', actionName: 'tables-create-records', input: { table_id: tableExternalId, values: { values: [{ [writeField]: inputRef }] } } },
            ...(withResponse ? [{ type: FlowActionType.PIECE, displayName: 'Respond', pieceName: '@activepieces/piece-subflows', actionName: 'returnResponse', input: { mode: 'simple', response: { response: { saved: true } } } }] : []),
        ],
    })
    return z.object({ externalId: z.string() }).parse(result.structuredContent)
}

async function buildCaller({ mcp, subflowExternalId, payload, waitForResponse }: { mcp: ProjectScopedMcpServer, subflowExternalId: string, payload: Record<string, string>, waitForResponse: boolean }): Promise<void> {
    await buildFlow({ mcp, flowName: 'Receive order', steps: [
        { type: FlowActionType.PIECE, displayName: 'Enrich', pieceName: '@activepieces/piece-subflows', actionName: 'callFlow', input: { flowId: subflowExternalId, mode: 'simple', flowProps: { payload }, waitForResponse } },
    ] })
}

async function buildFlow({ mcp, flowName, steps }: { mcp: ProjectScopedMcpServer, flowName: string, steps: unknown[] }): Promise<void> {
    await apBuildFlowTool({ mcp }, log).execute({
        flowName,
        folderName: SOLUTION_FOLDER,
        trigger: { pieceName: '@activepieces/piece-subflows', triggerName: 'callableFlow', input: { mode: 'simple', exampleData: { sampleData: {} } } },
        steps,
    })
}

async function issueMessages(mcp: ProjectScopedMcpServer): Promise<string[]> {
    return structured(await apValidateFlowTool({ mcp }, log).execute({ folderName: SOLUTION_FOLDER })).issues.map((issue) => issue.message)
}

function structured(result: { structuredContent?: unknown }): { ok: boolean, flowCount: number, issues: { message: string }[], unchecked: { message: string }[] } {
    return z.object({ ok: z.boolean(), flowCount: z.number(), issues: z.array(z.object({ message: z.string() })), unchecked: z.array(z.object({ message: z.string() })) }).parse(result.structuredContent)
}

function text(result: { content: Array<{ type: 'text', text: string }> }): string {
    return result.content.map((c) => c.text).join('\n')
}

const SOLUTION_FOLDER = 'Order intake'
