import { FlowAction, FlowActionType } from '../actions/action'
import { FlowOperationRequest, FlowOperationType, ImportFlowRequest } from '../operations'
import { FlowTrigger, FlowTriggerType } from '../triggers/trigger'

function isN8nWorkflow(value: unknown): value is N8nWorkflow {
    if (!isRecord(value)) {
        return false
    }
    return Array.isArray(value['nodes']) && isRecord(value['connections'])
}

function convert({ workflow }: ConvertN8nWorkflowParams): ConvertN8nWorkflowResult {
    const n8nNodes = workflow.nodes.filter(isN8nNode)
    const orderedNodes = orderNodes({ nodes: n8nNodes, connections: workflow.connections })
    const triggerNode = orderedNodes.find(isTriggerNode)
    const report: N8nImportReportItem[] = []
    const trigger = createTrigger({ node: triggerNode, report })
    const actionNodes = orderedNodes.filter((node) => node.id !== triggerNode?.id)
    const actions = actionNodes.map((node, index) => createAction({ node, index, report }))
    const triggerWithActions = withNextAction({
        trigger,
        nextAction: chainActions({ actions }),
    })

    return {
        request: {
            displayName: workflow.name ?? 'Imported n8n workflow',
            trigger: triggerWithActions,
        },
        report,
    }
}

function convertToImportOperation({ workflow }: ConvertN8nWorkflowParams): ConvertN8nWorkflowOperationResult {
    const result = convert({ workflow })
    return {
        operation: {
            type: FlowOperationType.IMPORT_FLOW,
            request: result.request,
        },
        report: result.report,
    }
}

function parse({ value }: ParseN8nWorkflowParams): ParseN8nWorkflowResult {
    if (typeof value !== 'string') {
        return { success: false }
    }

    const parsed = parseJson({ value })
    if (!parsed.success || !isN8nWorkflow(parsed.value)) {
        return { success: false }
    }

    return {
        success: true,
        workflow: parsed.value,
    }
}

function createTrigger({ node, report }: CreateTriggerParams): FlowTrigger {
    if (node === undefined) {
        report.push({
            nodeName: 'Workflow',
            nodeType: 'unknown',
            severity: 'warning',
            message: 'No n8n trigger node was found. The imported flow starts with an empty trigger.',
        })
        return createEmptyTrigger()
    }

    if (node.type === 'n8n-nodes-base.manualTrigger') {
        return createEmptyTrigger({ displayName: node.name })
    }

    if (node.type === 'n8n-nodes-base.scheduleTrigger' || node.type === 'n8n-nodes-base.cron') {
        return createScheduleTrigger({ node, report })
    }

    if (node.type === 'n8n-nodes-base.webhook') {
        return createWebhookTrigger({ node })
    }

    report.push({
        nodeName: node.name,
        nodeType: node.type,
        severity: 'warning',
        message: 'Unsupported trigger node. The imported flow starts with an empty trigger.',
    })

    return createEmptyTrigger({ displayName: node.name })
}

function createAction({ node, index, report }: CreateActionParams): FlowAction {
    if (node.type === 'n8n-nodes-base.httpRequest') {
        return createHttpRequestAction({ node, index })
    }

    if (node.type === 'n8n-nodes-base.code' || node.type === 'n8n-nodes-base.function' || node.type === 'n8n-nodes-base.functionItem') {
        return createCodeAction({
            node,
            index,
            code: getStringValue({ value: getNodeParameter({ node, key: 'jsCode' }) }) ?? getStringValue({ value: getNodeParameter({ node, key: 'functionCode' }) }) ?? DEFAULT_CODE,
            skip: false,
        })
    }

    report.push({
        nodeName: node.name,
        nodeType: node.type,
        severity: 'warning',
        message: 'Unsupported n8n node imported as a skipped placeholder.',
    })

    return createCodeAction({
        node,
        index,
        code: buildUnsupportedNodeCode({ node }),
        skip: true,
    })
}

function createEmptyTrigger(params: CreateEmptyTriggerParams = {}): FlowTrigger {
    return {
        name: 'trigger',
        valid: false,
        displayName: params.displayName ?? 'Select Trigger',
        lastUpdatedDate: getLastUpdatedDate(),
        type: FlowTriggerType.EMPTY,
        settings: {},
    }
}

function createScheduleTrigger({ node, report }: CreateTriggerParams & { node: N8nNode }): FlowTrigger {
    const interval = getScheduleInterval({ node })

    if (interval.kind === 'minutes') {
        return createPieceTrigger({
            displayName: node.name,
            pieceName: '@activepieces/piece-schedule',
            pieceVersion: CORE_PIECE_VERSIONS.schedule,
            triggerName: 'every_x_minutes',
            input: {
                minutes: interval.minutes,
            },
        })
    }

    if (interval.kind === 'day') {
        return createPieceTrigger({
            displayName: node.name,
            pieceName: '@activepieces/piece-schedule',
            pieceVersion: CORE_PIECE_VERSIONS.schedule,
            triggerName: 'every_day',
            input: {},
        })
    }

    if (interval.kind === 'month') {
        return createPieceTrigger({
            displayName: node.name,
            pieceName: '@activepieces/piece-schedule',
            pieceVersion: CORE_PIECE_VERSIONS.schedule,
            triggerName: 'every_month',
            input: {},
        })
    }

    report.push({
        nodeName: node.name,
        nodeType: node.type,
        severity: 'warning',
        message: 'Unsupported n8n schedule interval. The imported flow starts with an empty trigger.',
    })

    return createEmptyTrigger({ displayName: node.name })
}

function createWebhookTrigger({ node }: CreateWebhookTriggerParams): FlowTrigger {
    return createPieceTrigger({
        displayName: node.name,
        pieceName: '@activepieces/piece-webhook',
        pieceVersion: CORE_PIECE_VERSIONS.webhook,
        triggerName: 'catch_webhook',
        input: {},
    })
}

function createHttpRequestAction({ node, index }: CreateHttpRequestActionParams): FlowAction {
    return createPieceAction({
        node,
        index,
        pieceName: '@activepieces/piece-http',
        pieceVersion: CORE_PIECE_VERSIONS.http,
        actionName: 'send_request',
        input: {
            url: getStringValue({ value: getNodeParameter({ node, key: 'url' }) }) ?? '',
            method: getStringValue({ value: getNodeParameter({ node, key: 'method' }) }) ?? 'GET',
            headers: normalizeKeyValuePairs({ value: getNodeParameter({ node, key: 'sendHeaders' }) === true ? getNodeParameter({ node, key: 'headerParameters' }) : getNodeParameter({ node, key: 'headers' }) }),
            queryParams: normalizeKeyValuePairs({ value: getNodeParameter({ node, key: 'sendQuery' }) === true ? getNodeParameter({ node, key: 'queryParameters' }) : getNodeParameter({ node, key: 'qs' }) }),
            body_type: getNodeParameter({ node, key: 'sendBody' }) === true ? 'json' : 'none',
            body: getNodeParameter({ node, key: 'jsonBody' }) ?? getNodeParameter({ node, key: 'bodyParameters' }) ?? {},
            authType: 'none',
            response_is_binary: getNodeParameter({ node, key: 'responseFormat' }) === 'file',
            followRedirects: getNestedRecordValue({
                value: getNodeParameter({ node, key: 'redirect' }),
                key: 'followRedirects',
            }) ?? true,
            failureMode: 'continue_none',
        },
    })
}

function createPieceTrigger({ displayName, pieceName, pieceVersion, triggerName, input }: CreatePieceTriggerParams): FlowTrigger {
    return {
        name: 'trigger',
        valid: false,
        displayName,
        lastUpdatedDate: getLastUpdatedDate(),
        type: FlowTriggerType.PIECE,
        settings: {
            input,
            pieceName,
            pieceVersion,
            triggerName,
            propertySettings: {},
        },
    }
}

function createPieceAction({ node, index, pieceName, pieceVersion, actionName, input }: CreatePieceActionParams): FlowAction {
    return {
        name: createStepName({ node, index }),
        displayName: node.name,
        type: FlowActionType.PIECE,
        valid: false,
        lastUpdatedDate: getLastUpdatedDate(),
        settings: {
            input,
            pieceName,
            pieceVersion,
            actionName,
            propertySettings: {},
            errorHandlingOptions: {
                retryOnFailure: {
                    value: false,
                },
                continueOnFailure: {
                    value: false,
                },
            },
        },
    }
}

function createCodeAction({ node, index, code, skip }: CreateCodeActionParams): FlowAction {
    return {
        name: createStepName({ node, index }),
        displayName: node.name,
        type: FlowActionType.CODE,
        valid: !skip,
        skip,
        lastUpdatedDate: getLastUpdatedDate(),
        settings: {
            input: {},
            sourceCode: {
                packageJson: '{}',
                code,
            },
            errorHandlingOptions: {
                retryOnFailure: {
                    value: false,
                },
                continueOnFailure: {
                    value: false,
                },
            },
        },
    }
}

function chainActions({ actions }: ChainActionsParams): FlowAction | undefined {
    return actions.reduceRight<FlowAction | undefined>((nextAction, action) => ({
        ...action,
        nextAction,
    }), undefined)
}

function withNextAction({ trigger, nextAction }: WithNextActionParams): FlowTrigger {
    return {
        ...trigger,
        nextAction,
    }
}

function orderNodes({ nodes, connections }: OrderNodesParams): N8nNode[] {
    const nodeByName = new Map(nodes.map((node) => [node.name, node]))
    const incomingNames = new Set(
        Object.values(connections)
            .flatMap(getConnectionGroups)
            .flatMap((group) => group.map((connection) => connection.node)),
    )
    const startNodes = nodes.filter((node) => !incomingNames.has(node.name))
    const orderedNodes = walkNodes({
        nodes: startNodes.length > 0 ? startNodes : nodes,
        nodeByName,
        connections,
        visitedNodeNames: new Set(),
    })
    const orderedNodeNames = new Set(orderedNodes.map((node) => node.name))
    const remainingNodes = nodes.filter((node) => !orderedNodeNames.has(node.name))
    return [...orderedNodes, ...remainingNodes]
}

function walkNodes({ nodes, nodeByName, connections, visitedNodeNames }: WalkNodesParams): N8nNode[] {
    return nodes.reduce<N8nNode[]>((orderedNodes, node) => {
        if (visitedNodeNames.has(node.name)) {
            return orderedNodes
        }

        visitedNodeNames.add(node.name)
        const nextNodes = getConnectionGroups(connections[node.name])
            .flatMap((group) => group.map((connection) => nodeByName.get(connection.node)))
            .filter(isN8nNode)

        return [
            ...orderedNodes,
            node,
            ...walkNodes({ nodes: nextNodes, nodeByName, connections, visitedNodeNames }),
        ]
    }, [])
}

function getConnectionGroups(value: unknown): N8nConnection[][] {
    if (!isRecord(value)) {
        return []
    }

    return Object.values(value)
        .filter(Array.isArray)
        .flatMap((value) => value)
        .filter(isN8nConnectionArray)
}

function isTriggerNode(node: N8nNode): boolean {
    return TRIGGER_NODE_TYPES.has(node.type)
}

function getScheduleInterval({ node }: GetScheduleIntervalParams): ScheduleInterval {
    const ruleParameter = getNodeParameter({ node, key: 'rule' })
    const rule = Array.isArray(ruleParameter)
        ? ruleParameter[0]
        : ruleParameter
    const interval = isRecord(rule) && Array.isArray(rule['interval'])
        ? rule['interval'][0]
        : undefined
    const unit = isRecord(interval) ? getStringValue({ value: interval['field'] }) ?? getStringValue({ value: interval['unit'] }) : undefined

    if (unit === 'minutes' || unit === 'minute') {
        return {
            kind: 'minutes',
            minutes: getNumberValue({ value: isRecord(interval) ? interval['minutesInterval'] : undefined }) ?? 1,
        }
    }

    if (unit === 'days' || unit === 'day') {
        return { kind: 'day' }
    }

    if (unit === 'months' || unit === 'month') {
        return { kind: 'month' }
    }

    return { kind: 'unknown' }
}

function normalizeKeyValuePairs({ value }: NormalizeKeyValuePairsParams): Record<string, unknown> {
    if (!isRecord(value)) {
        return {}
    }

    const parameters = Array.isArray(value['parameters']) ? value['parameters'] : []
    return parameters.filter(isRecord).reduce<Record<string, unknown>>((result, parameter) => {
        const name = getStringValue({ value: parameter['name'] })
        if (name === undefined) {
            return result
        }
        return {
            ...result,
            [name]: parameter['value'],
        }
    }, {})
}

function buildUnsupportedNodeCode({ node }: BuildUnsupportedNodeCodeParams): string {
    return [
        'export const code = async (inputs) => {',
        `  // Unsupported n8n node: ${node.type}`,
        '  return inputs;',
        '};',
    ].join('\n')
}

function createStepName({ node, index }: CreateStepNameParams): string {
    const normalizedName = node.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '')

    return normalizedName.length > 0 ? `${normalizedName}_${index + 1}` : `step_${index + 1}`
}

function parseJson({ value }: ParseJsonParams): ParseJsonResult {
    try {
        return {
            success: true,
            value: JSON.parse(value),
        }
    }
    catch {
        return { success: false }
    }
}

function getStringValue({ value }: GetStringValueParams): string | undefined {
    return typeof value === 'string' ? value : undefined
}

function getNumberValue({ value }: GetNumberValueParams): number | undefined {
    return typeof value === 'number' ? value : undefined
}

function getNodeParameter({ node, key }: GetNodeParameterParams): unknown {
    return node.parameters?.[key]
}

function getNestedRecordValue({ value, key }: GetNestedRecordValueParams): unknown {
    return isRecord(value) ? value[key] : undefined
}

function getLastUpdatedDate(): string {
    return new Date().toISOString()
}

function isN8nNode(value: unknown): value is N8nNode {
    return isRecord(value) && typeof value['name'] === 'string' && typeof value['type'] === 'string'
}

function isN8nConnectionArray(value: unknown): value is N8nConnection[] {
    return Array.isArray(value) && value.every(isN8nConnection)
}

function isN8nConnection(value: unknown): value is N8nConnection {
    return isRecord(value) && typeof value['node'] === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const DEFAULT_CODE = [
    'export const code = async (inputs) => {',
    '  return inputs;',
    '};',
].join('\n')

const TRIGGER_NODE_TYPES = new Set([
    'n8n-nodes-base.manualTrigger',
    'n8n-nodes-base.scheduleTrigger',
    'n8n-nodes-base.cron',
    'n8n-nodes-base.webhook',
])

const CORE_PIECE_VERSIONS = {
    http: '0.11.10',
    schedule: '0.1.17',
    webhook: '0.1.35',
}

type ConvertN8nWorkflowParams = {
    workflow: N8nWorkflow
}

type ConvertN8nWorkflowResult = {
    request: ImportFlowRequest
    report: N8nImportReportItem[]
}

type ConvertN8nWorkflowOperationResult = {
    operation: FlowOperationRequest
    report: N8nImportReportItem[]
}

type ParseN8nWorkflowParams = {
    value: unknown
}

type ParseN8nWorkflowResult = {
    success: false
} | {
    success: true
    workflow: N8nWorkflow
}

type CreateTriggerParams = {
    node: N8nNode | undefined
    report: N8nImportReportItem[]
}

type CreateWebhookTriggerParams = {
    node: N8nNode
}

type CreateActionParams = {
    node: N8nNode
    index: number
    report: N8nImportReportItem[]
}

type CreateHttpRequestActionParams = {
    node: N8nNode
    index: number
}

type CreateEmptyTriggerParams = {
    displayName?: string
}

type CreatePieceTriggerParams = {
    displayName: string
    pieceName: string
    pieceVersion: string
    triggerName: string
    input: Record<string, unknown>
}

type CreatePieceActionParams = {
    node: N8nNode
    index: number
    pieceName: string
    pieceVersion: string
    actionName: string
    input: Record<string, unknown>
}

type CreateCodeActionParams = {
    node: N8nNode
    index: number
    code: string
    skip: boolean
}

type ChainActionsParams = {
    actions: FlowAction[]
}

type WithNextActionParams = {
    trigger: FlowTrigger
    nextAction: FlowAction | undefined
}

type OrderNodesParams = {
    nodes: N8nNode[]
    connections: Record<string, unknown>
}

type WalkNodesParams = {
    nodes: N8nNode[]
    nodeByName: Map<string, N8nNode>
    connections: Record<string, unknown>
    visitedNodeNames: Set<string>
}

type GetScheduleIntervalParams = {
    node: N8nNode
}

type NormalizeKeyValuePairsParams = {
    value: unknown
}

type BuildUnsupportedNodeCodeParams = {
    node: N8nNode
}

type CreateStepNameParams = {
    node: N8nNode
    index: number
}

type ParseJsonParams = {
    value: string
}

type ParseJsonResult = {
    success: false
} | {
    success: true
    value: unknown
}

type GetStringValueParams = {
    value: unknown
}

type GetNumberValueParams = {
    value: unknown
}

type GetNodeParameterParams = {
    node: N8nNode
    key: string
}

type GetNestedRecordValueParams = {
    value: unknown
    key: string
}

type ScheduleInterval = {
    kind: 'minutes'
    minutes: number
} | {
    kind: 'day'
} | {
    kind: 'month'
} | {
    kind: 'unknown'
}

export type N8nWorkflow = {
    name?: string
    nodes: unknown[]
    connections: Record<string, unknown>
}

type N8nNode = {
    id?: string
    name: string
    type: string
    parameters?: Record<string, unknown>
}

type N8nConnection = {
    node: string
}

export type N8nImportReportItem = {
    nodeName: string
    nodeType: string
    severity: 'warning'
    message: string
}

export const n8nWorkflowConverter = {
    convert,
    convertToImportOperation,
    isN8nWorkflow,
    parse,
}
