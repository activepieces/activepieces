import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ActivepiecesError, AIProviderName, apId, ErrorCode, isNil, PlatformId, ProjectId, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { agentAiUtils } from '@activepieces/server-utils'
import { AgentTool, AgentToolType, AppConnectionStatus, CHAT_BYOK_CREDIT_WEIGHT, DEFAULT_CHAT_TIER_ID, DraftAgentReply, DraftAgentResponse, isAppSumoCreditedPlan, mcpToolNameUtils } from '@activepieces/shared'
import { APICallError, generateText, LanguageModel } from 'ai'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { pieceMetadataService } from '../../pieces/metadata/piece-metadata-service'
import { trackBillingAndSendTelemetry } from '../../platform/billing-and-telemetry'
import { CreditUsageSource } from '../../platform/billing-provider'
import { platformPlanService } from '../platform/platform-plan/platform-plan.service'
import { agentHelpers } from './agent-helpers'

const DRAFT_TIMEOUT_MS = 30_000
const REPLY_LOG_LIMIT = 500
const REASON_LIMIT = 200
const FAST_TIER_ID = 'fast'
const CANDIDATE_PIECE_LIMIT = 8
const CANDIDATE_CONNECTION_LIMIT = 100
const CANDIDATE_ACTION_LIMIT = 25
const SUGGESTED_TOOL_LIMIT = 4
const DRAFT_SYSTEM_PROMPT = readFileSync(path.resolve('packages/server/api/src/assets/prompts/agent-draft-prompt.md'), 'utf8')

export const agentDraftAi = (log: FastifyBaseLogger) => ({
    async draft({ platformId, projectId, prompt }: DraftParams): Promise<DraftAgentResponse> {
        const { data: resolved, error: modelError } = await tryCatch(() => agentHelpers.resolveTierModel({ platformId, tierId: FAST_TIER_ID, scope: agentHelpers.runScopeOrThrow({ projectId }), log }))
        if (!isNil(modelError) || isNil(resolved)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Connect an AI provider before drafting an agent, or start from a starter agent instead' },
            })
        }

        // Drafting asks for the cheap tier, which is a different model from the one chat runs on, so
        // an account that can serve one and not the other has working chat and failing drafts. A
        // refused key will refuse again, but anything else is worth one attempt on chat's own model.
        const candidates = await connectedCandidates({ projectId, platformId, log })
        // The attempt and the model that made it move together, so the agent cannot be written down
        // as running the model that failed. Two separate variables drifted once already.
        let run = { attempt: await runDraft({ model: resolved.model, prompt: withCandidates({ prompt, candidates }) }), on: resolved }
        if (!isNil(run.attempt.error) && !rejectedCredentials(statusOf(run.attempt.error))) {
            const { data: fallback } = await tryCatch(() => agentHelpers.resolveTierModel({ platformId, tierId: DEFAULT_CHAT_TIER_ID, scope: agentHelpers.runScopeOrThrow({ projectId }), log }))
            if (!isNil(fallback) && fallback.modelId !== resolved.modelId) {
                log.warn({ from: resolved.modelId, to: fallback.modelId, platform: { id: platformId } }, '[agentDraftAi] Retrying the draft on the model chat runs on')
                run = { attempt: await runDraft({ model: fallback.model, prompt: withCandidates({ prompt, candidates }) }), on: fallback }
            }
        }

        const { data: raw, error: generateError } = run.attempt
        if (!isNil(generateError) || isNil(raw)) {
            const reason = describeError(generateError)
            const status = statusOf(generateError)
            log.error({ error: generateError, reason, status, provider: run.on.provider, model: { id: run.on.modelId }, platform: { id: platformId } }, '[agentDraftAi] The model call failed while drafting an agent')
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: rejectedCredentials(status)
                    ? `${run.on.provider} rejected the API key. Update it in the AI settings and try again.`
                    : `The ${run.on.provider} provider could not run ${run.on.modelId}: ${reason.slice(0, REASON_LIMIT)}` },
            })
        }

        const parsed = parseDraft(raw)
        if (isNil(parsed)) {
            log.error({ platform: { id: platformId }, reply: raw.slice(0, REPLY_LOG_LIMIT) }, '[agentDraftAi] The model replied with something that is not a draft')
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: 'Could not draft an agent from that description, try rewording it' },
            })
        }
        await debitDraft({ platformId, projectId, log })
        return {
            ...parsed,
            tools: resolveToolPicks({ picks: parsed.tools, candidates }),
            provider: run.on.provider,
            modelName: run.on.modelId,
        }
    },
})

// Only what the project already has a connection for is offered, so a drafted agent can run rather
// than arriving with tools nobody has signed into. Everything the model names is looked up again
// below: a piece or action it invented is dropped, never stored.
async function connectedCandidates({ projectId, platformId, log }: { projectId: ProjectId, platformId: PlatformId, log: FastifyBaseLogger }): Promise<Candidate[]> {
    const { data: page } = await tryCatch(() => appConnectionService(log).list({
        projectId, platformId,
        pieceName: undefined, displayName: undefined,
        cursorRequest: null, scope: undefined, externalIds: undefined,
        ...candidateQuery(),
    }))
    const resolved = await Promise.all(firstConnectionPerPiece(page?.data ?? []).map(async ([pieceName, connectionExternalId]) => {
        const { data: piece } = await tryCatch(() => pieceMetadataService(log).get({ name: pieceName, projectId, platformId }))
        if (isNil(piece)) {
            return []
        }
        const candidate: Candidate = {
            pieceName,
            pieceVersion: piece.version,
            connectionExternalId,
            actionNames: Object.keys(piece.actions).slice(0, CANDIDATE_ACTION_LIMIT),
        }
        return [candidate]
    }))
    return resolved.flat().filter((candidate) => candidate.actionNames.length > 0)
}

// A tool bound to a broken account reads as ready and fails on first use, so only working
// connections are offered. The cap is on apps, which means it has to be applied after several
// accounts for one app collapse to one: capping the rows let three apps fill a budget meant for eight.
function candidateQuery(): { status: AppConnectionStatus[], limit: number } {
    return { status: [AppConnectionStatus.ACTIVE], limit: CANDIDATE_CONNECTION_LIMIT }
}

function firstConnectionPerPiece(connections: { pieceName: string, externalId: string }[]): [string, string][] {
    const byPiece = new Map<string, string>()
    for (const connection of connections) {
        if (!byPiece.has(connection.pieceName)) {
            byPiece.set(connection.pieceName, connection.externalId)
        }
    }
    return [...byPiece].slice(0, CANDIDATE_PIECE_LIMIT)
}

function withCandidates({ prompt, candidates }: { prompt: string, candidates: Candidate[] }): string {
    if (candidates.length === 0) {
        return `${prompt}\n\nConnected apps: none. Return an empty tools list.`
    }
    const listed = candidates.map((candidate) => `${candidate.pieceName} (${candidate.actionNames.join(', ')})`).join('\n')
    return `${prompt}\n\nConnected apps:\n${listed}`
}

function resolveToolPicks({ picks, candidates }: { picks: DraftAgentReply['tools'], candidates: Candidate[] }): AgentTool[] {
    const seen = new Set<string>()
    return picks.flatMap((pick) => {
        const candidate = candidates.find((entry) => entry.pieceName === pick.pieceName)
        if (isNil(candidate) || !candidate.actionNames.includes(pick.actionName)) {
            return []
        }
        const key = `${candidate.pieceName}:${pick.actionName}`
        if (seen.has(key)) {
            return []
        }
        seen.add(key)
        const tool: AgentTool = {
            type: AgentToolType.PIECE,
            toolName: mcpToolNameUtils.createPieceToolName(candidate.pieceName, pick.actionName),
            pieceMetadata: {
                pieceName: candidate.pieceName,
                pieceVersion: candidate.pieceVersion,
                actionName: pick.actionName,
                predefinedInput: { auth: candidate.connectionExternalId, fields: {} },
            },
        }
        return [tool]
    }).slice(0, SUGGESTED_TOOL_LIMIT)
}

// The telemetry sink renders the SDK's wrapped provider failure as "[object Object]".
// 401 is the key itself being refused, and the body says so in terms written for whoever holds it
// rather than whoever configured it: OpenRouter answers "User not found". 403 is a key that
// resolved but may not carry this model, so its own reason is the useful one and is left alone.
async function runDraft({ model, prompt }: { model: LanguageModel, prompt: string }) {
    return tryCatch(async () => {
        const { text } = await generateText({
            model,
            instructions: DRAFT_SYSTEM_PROMPT,
            prompt,
            telemetry: agentAiUtils.buildTelemetry({ functionId: 'agent-draft' }),
            abortSignal: AbortSignal.timeout(DRAFT_TIMEOUT_MS),
        })
        return text
    })
}

function statusOf(error: unknown): number | undefined {
    return APICallError.isInstance(error) ? error.statusCode : undefined
}

function rejectedCredentials(status?: number): boolean {
    return status === 401
}

function describeError(error: unknown): string {
    if (!(error instanceof Error)) {
        return String(error)
    }
    const parts = [error.message]
    const cause = (error as { cause?: unknown }).cause
    if (cause instanceof Error) {
        parts.push(cause.message)
    }
    return parts.filter((part) => part.length > 0).join(' | ')
}

function parseDraft(raw: string): DraftAgentReply | null {
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end <= start) {
        return null
    }
    const { data: json, error } = tryCatchSync(() => JSON.parse(raw.slice(start, end + 1)))
    if (!isNil(error)) {
        return null
    }
    const parsed = DraftAgentReply.safeParse(json)
    return parsed.success ? parsed.data : null
}

async function debitDraft({ platformId, projectId, log }: { platformId: PlatformId, projectId: ProjectId, log: FastifyBaseLogger }): Promise<void> {
    const { error } = await tryCatch(async () => {
        const provider = await agentHelpers.resolveChatProviderName({ platformId, projectId, log })
        const value = provider === AIProviderName.ACTIVEPIECES ? agentHelpers.resolveTier({ tierId: FAST_TIER_ID }).creditWeight : CHAT_BYOK_CREDIT_WEIGHT
        const platformPlan = await platformPlanService(log).getOrCreateForPlatform(platformId)
        const usage = {
            platformId,
            value,
            source: CreditUsageSource.AGENT_DRAFT as const,
            idempotencyKey: `agent-draft:${apId()}`,
            properties: { platformId, projectId, provider },
        }
        await trackBillingAndSendTelemetry({
            log,
            licenseKey: platformPlan.licenseKey,
            credits: usage,
            ...(isAppSumoCreditedPlan(platformPlan.plan) ? { appSumo: { ...usage, idempotencyKey: `agent-draft-appsumo:${apId()}` } } : {}),
        })
    })
    if (!isNil(error)) {
        log.warn({ error, platform: { id: platformId } }, '[agentDraftAi] Draft usage was not recorded')
    }
}

export const agentDraftTools = { withCandidates, resolveToolPicks, candidateQuery, firstConnectionPerPiece, PIECE_LIMIT: CANDIDATE_PIECE_LIMIT }

type Candidate = {
    pieceName: string
    pieceVersion: string
    connectionExternalId: string
    actionNames: string[]
}

type DraftParams = {
    platformId: PlatformId
    projectId: ProjectId
    prompt: string
}
