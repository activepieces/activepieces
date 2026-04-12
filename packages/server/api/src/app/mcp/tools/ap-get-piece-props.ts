import { PiecePropertyMap, PropertyType } from '@activepieces/pieces-framework'
import {
    EngineResponse,
    EngineResponseStatus,
    FlowVersion,
    isNil,
    McpServer,
    McpToolDefinition,
    SampleDataFileType,
    WorkerJobType,
} from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'
import { sampleDataService } from '../../flows/step-run/sample-data.service'
import { getPiecePackageWithoutArchive } from '../../pieces/metadata/piece-metadata-service'
import { projectService } from '../../project/project-service'
import { userInteractionWatcher } from '../../workers/user-interaction-watcher'
import { mcpUtils } from './mcp-utils'

export const apGetPiecePropsTool = (mcp: McpServer, log: FastifyBaseLogger): McpToolDefinition => {
    return {
        title: 'ap_get_piece_props',
        description: 'Get the input property schema for a piece action or trigger. Returns field names, types, required/optional, defaults, and options. Pass auth to resolve dynamic dropdown values.',
        inputSchema: getPiecePropsInput.shape,
        annotations: { readOnlyHint: true, openWorldHint: false },
        execute: async (args) => {
            try {
                const { pieceName, actionOrTriggerName, type, auth, flowId } = getPiecePropsInput.parse(args)

                const lookup = await mcpUtils.lookupPieceComponent({
                    pieceName,
                    componentName: actionOrTriggerName,
                    componentType: type,
                    projectId: mcp.projectId,
                    log,
                })
                if (lookup.error) {
                    return lookup.error
                }

                const { piece, component, pieceName: normalized } = lookup
                const label = type === 'action' ? 'Action' : 'Trigger'
                const props = mcpUtils.buildPropSummaries(component.props)
                const requiresAuth = component.requireAuth && !isNil(piece.auth)

                if (auth) {
                    await resolveDropdownOptions({
                        props,
                        componentProps: component.props,
                        pieceName: normalized,
                        pieceVersion: piece.version,
                        actionOrTriggerName,
                        auth,
                        flowId,
                        projectId: mcp.projectId,
                        log,
                    })
                }

                const result = {
                    piece: normalized,
                    name: component.name,
                    displayName: component.displayName,
                    description: component.description,
                    requiresAuth,
                    props,
                }

                return {
                    content: [{ type: 'text', text: `✅ ${label} schema for "${normalized}/${actionOrTriggerName}":\n${JSON.stringify(result, null, 2)}` }],
                }
            }
            catch (err) {
                return mcpUtils.mcpToolError('Failed to get piece props', err)
            }
        },
    }
}

const getPiecePropsInput = z.object({
    pieceName: z.string().describe('The piece name (e.g. "@activepieces/piece-slack"). Use ap_list_pieces to get valid values.'),
    actionOrTriggerName: z.string().describe('The action or trigger name (e.g. "send_channel_message"). Use ap_list_pieces with includeActions=true or includeTriggers=true to get valid values.'),
    type: z.enum(['action', 'trigger']).describe('Whether to look up an action or a trigger.'),
    auth: z.string().optional().describe('Connection externalId from ap_list_connections. When provided, dynamic dropdowns return actual options instead of a placeholder note.'),
    flowId: z.string().optional().describe('Flow ID for resolving dependent dropdowns that need step context. Optional — most dropdowns work without it.'),
})

const DROPDOWN_TYPES = new Set([PropertyType.DROPDOWN, PropertyType.MULTI_SELECT_DROPDOWN])

async function resolveDropdownOptions({ props, componentProps, pieceName, pieceVersion, actionOrTriggerName, auth, flowId, projectId, log }: ResolveDropdownParams): Promise<void> {
    const project = await projectService(log).getOneOrThrow(projectId)
    const piecePackage = await getPiecePackageWithoutArchive(log, project.platformId, { pieceName, pieceVersion })

    let flowVersion: FlowVersion | undefined
    let sampleData: Record<string, unknown> = {}
    if (flowId) {
        const flow = await flowService(log).getOnePopulated({ id: flowId, projectId })
        if (flow) {
            flowVersion = flow.version
            sampleData = await sampleDataService(log).getSampleDataForFlow(projectId, flow.version, SampleDataFileType.OUTPUT)
        }
    }

    const input: Record<string, unknown> = { auth: `{{connections['${auth}']}}` }

    const dropdownProps = props.filter(prop => {
        const propDef = componentProps[prop.name]
        return DROPDOWN_TYPES.has(prop.type) && !isNil(propDef) && 'refreshers' in propDef
    })

    await Promise.all(dropdownProps.map(async (prop) => {
        try {
            const result = await withTimeout(
                userInteractionWatcher.submitAndWaitForResponse<EngineResponse<{
                    options: Array<{ label: string, value: unknown }>
                    disabled?: boolean
                }>>({
                    jobType: WorkerJobType.EXECUTE_PROPERTY,
                    platformId: project.platformId,
                    projectId,
                    flowVersion,
                    propertyName: prop.name,
                    actionOrTriggerName,
                    input,
                    sampleData,
                    searchValue: undefined,
                    piece: piecePackage,
                }, log),
                DROPDOWN_TIMEOUT_MS,
            )

            if (result.status === EngineResponseStatus.OK && result.response?.options && Array.isArray(result.response.options)) {
                prop.options = result.response.options.map((o: { label: string, value: unknown }) => ({ label: o.label, value: o.value }))
                prop.note = undefined
            }
        }
        catch (err) {
            log.debug({ err, propertyName: prop.name }, 'Failed to resolve dropdown options, keeping placeholder note')
        }
    }))
}

const DROPDOWN_TIMEOUT_MS = 15_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout>
    return Promise.race([
        promise.finally(() => clearTimeout(timer)),
        new Promise<never>((_resolve, reject) => {
            timer = setTimeout(() => reject(new Error(`Dropdown resolution timed out after ${ms}ms`)), ms)
        }),
    ])
}

type ResolveDropdownParams = {
    props: Array<{ name: string, type: PropertyType, options?: unknown, note?: string | undefined }>
    componentProps: PiecePropertyMap
    pieceName: string
    pieceVersion: string
    actionOrTriggerName: string
    auth: string
    flowId: string | undefined
    projectId: string
    log: FastifyBaseLogger
}
