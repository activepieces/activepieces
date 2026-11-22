import { isNil, tryCatch } from '@activepieces/core-utils'
import { AppConnectionStatus, pickDefaultConnectionExternalId } from '@activepieces/shared'
import { z } from 'zod'
import { agentWorkerTools, GateDecision } from '../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'
import { LiveSettings } from './eval-case'

function create({ answers, listConnections, projectId }: { answers: LiveSettings['answers'], listConnections: (pieceName: string) => Promise<ProjectConnection[]>, projectId: string }): ScriptedUser {
    const openCards = new Map<string, OpenCard>()
    const shown: string[] = []
    const overrides = new Map(Object.entries(answers.connections).map(([piece, choice]) => [agentWorkerTools.normalizePieceName(piece), choice]))

    const answerConnectionCard = async ({ piece }: { piece: string }): Promise<GateDecision> => {
        const pieceName = agentWorkerTools.normalizePieceName(piece)
        const override = overrides.get(pieceName)
        if (override === NO_CONNECTION) {
            return DECLINED
        }
        const chosen = pickConnection({ connections: await listConnections(pieceName), override })
        if (isNil(chosen)) {
            return DECLINED
        }
        return { outcome: 'approved', payload: { connectionExternalId: chosen.externalId, label: chosen.displayName, projectId } }
    }

    return {
        onGateOpened: async ({ gateId, toolName, toolInput }) => {
            openCards.set(gateId, { toolName, piece: typeof toolInput['piece'] === 'string' ? toolInput['piece'] : '' })
            shown.push(toolName)
        },
        waitForApproval: async ({ gateId }) => {
            const card = openCards.get(gateId)
            openCards.delete(gateId)
            if (isNil(card) || !answersCard(card.toolName)) {
                return DECLINED
            }
            if (card.toolName === QUESTIONS_CARD) {
                return { outcome: 'approved', payload: { answers: answers.questions ?? DEFAULT_QUESTION_ANSWER } }
            }
            return answerConnectionCard({ piece: card.piece })
        },
        cardsShown: () => [...shown],
    }
}

async function missingConnections({ answers, listConnections }: { answers: LiveSettings['answers'], listConnections: (pieceName: string) => Promise<ProjectConnection[]> }): Promise<string[]> {
    const wanted = Object.entries(answers.connections).filter(([, choice]) => choice !== NO_CONNECTION)
    const missing = await Promise.all(wanted.map(async ([piece, choice]) => {
        const { data: connections } = await tryCatch(() => listConnections(agentWorkerTools.normalizePieceName(piece)))
        return isNil(pickConnection({ connections: connections ?? [], override: choice })) ? [choice] : []
    }))
    return missing.flat()
}

function answersCard(toolName: string): boolean {
    return toolName === QUESTIONS_CARD || CONNECTION_CARDS.has(toolName)
}

function pickConnection({ connections, override }: { connections: ProjectConnection[], override: string | undefined }): ProjectConnection | undefined {
    if (!isNil(override)) {
        return connections.find((connection) => connection.externalId === override || connection.displayName === override)
    }
    const healthy = connections.filter((connection) => connection.status === AppConnectionStatus.ACTIVE)
    const externalId = pickDefaultConnectionExternalId({ healthy, updatedByExternalId: {} })
    return healthy.find((connection) => connection.externalId === externalId)
}

const NO_CONNECTION = 'none'
const QUESTIONS_CARD = 'ap_show_questions'
const CONNECTION_CARDS = new Set(['ap_show_connection_picker', 'ap_show_connection_required'])
const DEFAULT_QUESTION_ANSWER = 'Use sensible defaults for anything you need to decide.'
const DECLINED: GateDecision = { outcome: 'declined' }

export const ProjectConnection = z.object({ externalId: z.string(), displayName: z.string(), status: z.string() })

export const scriptedUser = {
    create,
    answersCard,
    missingConnections,
}

export type ScriptedUser = Pick<DisplayToolOptions, 'waitForApproval'> & Required<Pick<DisplayToolOptions, 'onGateOpened'>> & {
    cardsShown: () => string[]
}

export type ProjectConnection = z.infer<typeof ProjectConnection>

type DisplayToolOptions = Parameters<typeof agentWorkerTools.createDisplayTools>[0]

type OpenCard = { toolName: string, piece: string }
