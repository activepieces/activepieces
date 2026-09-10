import { ActivepiecesError, connectionTemplate, ErrorCode, isNil, Permission, spreadIfDefined } from '@activepieces/core-utils'
import { ActionClassification, isReadOnlyClassification } from '@activepieces/pieces-framework'
import { AgentConversation, AgentConversationStatus, AgentPieceToolMetadata, AgentRunSource, agentToolClassification, ApplicationEventName } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { agentHelpers } from '.././agent-helpers'
import { agentService } from '.././agent-service'
import { agentToolPinning } from '.././agent-tool-pinning'
import { appConnectionService } from '../../../app-connection/app-connection-service/app-connection-service'
import { applicationEvents } from '../../../helper/application-events'
import { resolvePermissionChecker } from '../../../mcp/mcp-permissions'
import { mcpUtils } from '../../../mcp/tools/mcp-utils'



// Gate the UPDATE on the persisted owning run (activeRunId, claimed at turn start) so a run
// preempted by a newer message matches zero rows — the ownership check is part of the write, with
// no check-then-write window. A nil runId or unclaimed row (activeRunId IS NULL) writes freely.
export async function updateConversationForRun({ conversationId, runId, updates }: {
    conversationId: string
    runId?: string
    updates: Record<string, unknown>
}): Promise<boolean> {
    const builder = agentHelpers.conversationRepo()
        .createQueryBuilder()
        .update()
        .set(updates)
        .where('id = :id', { id: conversationId })
    if (!isNil(runId)) {
        builder.andWhere('("activeRunId" IS NULL OR "activeRunId" = :runId)', { runId })
    }
    const result = await builder.returning('id').execute()
    const updatedRows: unknown[] = result.raw ?? []
    return updatedRows.length > 0
}

export async function connectionForConfiguredTool({ piece, projectId, platformId, log }: {
    piece: AgentPieceToolMetadata
    projectId: string
    platformId: string
    log: FastifyBaseLogger
}): Promise<{ externalId?: string, label?: string }> {
    const pinned = connectionTemplate.unwrapExternalId(piece.predefinedInput?.auth) ?? undefined
    if (isNil(pinned)) {
        return {}
    }
    const connection = await appConnectionService(log).getOneWithoutValue({ projectId, platformId, externalId: pinned })
    return { externalId: pinned, ...spreadIfDefined('label', connection?.displayName) }
}

export async function configuredToolConversationOrThrow({ conversationId }: { conversationId: string }): Promise<ConfiguredToolRun> {
    const conversation = await agentHelpers.conversationRepo().findOne({ where: { id: conversationId }, relations: { agent: true } })
    if (isNil(conversation) || !CONFIGURED_TOOL_SOURCES.includes(conversation.source) || isNil(conversation.projectId)) {
        throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'This run is not allowed to run a configured piece tool' } })
    }
    return {
        projectId: conversation.projectId,
        platformId: conversation.platformId,
        userId: conversation.userId,
        source: conversation.source,
        ...spreadIfDefined('agent', isNil(conversation.agentId) ? undefined : {
            id: conversation.agentId,
            ...spreadIfDefined('displayName', conversation.agent?.displayName),
        }),
    }
}

export async function loadOrStartConversation({ conversationId, platformId, userId, source, projectId, modelName }: {
    conversationId: string
    platformId: string
    userId: string
    source?: AgentRunSource
    projectId?: string | null
    modelName?: string | null
}): Promise<AgentConversation> {
    if (source !== AgentRunSource.FLOW_STEP) {
        return agentHelpers.getConversationOrThrow({ id: conversationId, platformId, userId })
    }
    const existing = await agentHelpers.conversationRepo().findOneBy({ id: conversationId })
    if (!isNil(existing)) {
        if (existing.platformId !== platformId || existing.userId !== userId || existing.source !== AgentRunSource.FLOW_STEP) {
            throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'That conversation belongs to someone else' } })
        }
        return existing
    }
    return agentHelpers.conversationRepo().save({
        id: conversationId,
        platformId,
        projectId: projectId ?? null,
        userId,
        source: AgentRunSource.FLOW_STEP,
        title: null,
        modelName: modelName ?? null,
        messages: [],
        status: AgentConversationStatus.IDLE,
    })
}

export async function confinedRunFor({ conversationId }: { conversationId?: string }): Promise<ConfinedRun> {
    const conversation = isNil(conversationId) ? null : await agentHelpers.conversationRepo().findOneBy({ id: conversationId })
    if (isNil(conversation?.projectId)) {
        throw new ActivepiecesError({ code: ErrorCode.AUTHORIZATION, params: { message: 'This run must be confined to a project' } })
    }
    return {
        projectId: conversation.projectId,
        ...spreadIfDefined('editableAgentId', conversation.source === AgentRunSource.AGENT ? conversation.agentId ?? undefined : undefined),
    }
}

export async function pinConnectionToAgent({ conversationId, pieceName, externalId, platformId, userId, log }: {
    conversationId: string
    pieceName: string
    externalId: string
    platformId: string
    userId: string
    log: FastifyBaseLogger
}): Promise<void> {
    const conversation = await agentHelpers.getConversationOrThrow({ id: conversationId, platformId, userId })
    // Both surfaces that configure a saved agent get the picker, and the builder is where it fires
    // most, so pinning has to cover both. Everything else keeps the account for its own run.
    const configuresAnAgent = conversation.source === AgentRunSource.AGENT || conversation.source === AgentRunSource.AGENT_BUILDER
    if (!configuresAnAgent || isNil(conversation.agentId)) {
        return
    }
    const agent = await agentService(log).getOneOrThrowByPlatform({ id: conversation.agentId, platformId, userId })
    const refuse = (reason: string): void => log.warn({
        conversation: { id: conversationId },
        connection: { id: externalId },
        piece: { name: pieceName },
        agent: { id: agent.id },
    }, `[agentRpc#pinConnectionToAgent] ${reason}`)

    // getOneOrThrowByPlatform resolves through READ_AGENT, which is enough to talk to a shared
    // agent and not enough to change what it runs on. Pinning is a write to the saved agent, so it
    // asks for the same permission ap_add_agent_tool does.
    const checker = await resolvePermissionChecker({ userId, projectId: agent.projectId, log })
    if (!isNil(checker.check(Permission.WRITE_AGENT, '__store_selected_connection'))) {
        refuse('Caller cannot write this agent, so the account was used for this run only')
        return
    }
    // externalId arrives from the approval payload, and it is neither validated nor unique across
    // projects. Writing it unchecked would let a run bind an agent to another project's connection,
    // or hand one app's credential to a different app's action.
    const connection = await appConnectionService(log).getOneWithoutValue({ projectId: agent.projectId, platformId, externalId })
    if (isNil(connection)) {
        refuse('No such connection in the agent project, so nothing was pinned')
        return
    }
    if (mcpUtils.normalizePieceName(connection.pieceName) !== mcpUtils.normalizePieceName(pieceName)) {
        refuse(`Connection is for ${connection.pieceName}, not ${pieceName}, so nothing was pinned`)
        return
    }
    const pinned = await agentService(log).editDraftTools({
        id: agent.id,
        projectId: agent.projectId,
        userId,
        edit: (tools) => agentToolPinning.pinConnection({ tools, pieceName, externalId }),
    })
    log.info({
        conversation: { id: conversationId },
        connection: { id: externalId },
        piece: { name: pieceName },
        agent: { id: agent.id },
    }, isNil(pinned) ? '[agentRpc#pinConnectionToAgent] No agent tool to pin' : '[agentRpc#pinConnectionToAgent] Pinned the account to the agent draft')
}

export function byteLengthOf(value: unknown): number {
    try {
        return Buffer.byteLength(JSON.stringify(value) ?? '', 'utf8')
    }
    catch {
        return -1
    }
}

export const CONNECTION_INVENTORY_LIMIT = 200
export const CONFIGURED_TOOL_SOURCES: AgentRunSource[] = [AgentRunSource.FLOW_STEP, AgentRunSource.AGENT]

export type ConfinedRun = {
    projectId: string
    editableAgentId?: string
}

export type ConfiguredToolRun = {
    projectId: string
    platformId: string
    userId: string
    source: AgentRunSource
    agent?: { id: string, displayName?: string }
}

export function recordAgentAction({ run, conversationId, flow, piece, resolvedInput, names, classification, connection, log }: {
    run: { projectId: string, platformId: string, userId: string, source: AgentRunSource, agent?: { id: string, displayName?: string } }
    conversationId?: string
    flow?: { id: string, runId: string }
    piece: { pieceName: string, actionName: string }
    resolvedInput: Record<string, unknown>
    names: { action: string, piece: string }
    classification?: ActionClassification
    connection: { externalId?: string, label?: string }
    log: FastifyBaseLogger
}): void {
    const readOnly = isNil(classification)
        ? agentToolClassification.isReadOnlyActionCall({ actionName: piece.actionName, input: resolvedInput })
        : isReadOnlyClassification(classification)
    if (readOnly) {
        return
    }
    const { projectId, platformId, userId, source, agent } = run
    applicationEvents(log).sendUserEvent({ platformId, projectId, userId }, {
        action: ApplicationEventName.AGENT_ACTION_EXECUTED,
        data: {
            ...spreadIfDefined('conversation', isNil(conversationId) ? undefined : { id: conversationId, source }),
            ...spreadIfDefined('flow', flow),
            source,
            ...spreadIfDefined('agent', agent),
            action: {
                pieceName: piece.pieceName,
                pieceDisplayName: names.piece,
                actionName: piece.actionName,
                displayName: names.action,
            },
            ...spreadIfDefined('connection', isNil(connection.externalId) ? undefined : {
                externalId: connection.externalId,
                ...spreadIfDefined('label', connection.label),
            }),
        },
    })
}
