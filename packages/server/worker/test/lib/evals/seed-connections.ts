import { isNil, isObject, tryCatch } from '@activepieces/core-utils'
import { agentWorkerTools } from '../../../src/lib/execute/jobs/ee/agent/agent-worker-tools'
import { LiveSettings, SeedFlow } from './eval-case'
import { ProjectConnection, scriptedUser } from './scripted-user'

async function resolve({ flows, answers, listConnections }: ResolveParams): Promise<ResolvedFlows> {
    const listed = new Map<string, Promise<ListedConnections>>()
    const connectionsOf = (pieceName: string): Promise<ListedConnections> => {
        const cached = listed.get(pieceName) ?? listOnce({ pieceName, listConnections })
        listed.set(pieceName, cached)
        return cached
    }
    const resolved = await Promise.all(flows.map((flow) => resolveFlow({ flow, answers, connectionsOf })))
    return { flows: resolved.map((entry) => entry.flow), unmet: [...new Set(resolved.flatMap((entry) => entry.unmet))] }
}

async function unmet(params: ResolveParams): Promise<string[]> {
    return (await resolve(params)).unmet
}

async function resolveFlow({ flow, answers, connectionsOf }: { flow: SeedFlow, answers: LiveSettings['answers'], connectionsOf: (pieceName: string) => Promise<ListedConnections> }): Promise<{ flow: SeedFlow, unmet: string[] }> {
    const trigger = await resolveComponent({ component: flow['trigger'], answers, connectionsOf })
    const steps = Array.isArray(flow['steps'])
        ? await Promise.all(flow['steps'].map((step) => resolveComponent({ component: step, answers, connectionsOf })))
        : []
    return {
        flow: {
            ...flow,
            ...(isNil(flow['trigger']) ? {} : { trigger: trigger.component }),
            ...(Array.isArray(flow['steps']) ? { steps: steps.map((step) => step.component) } : {}),
        },
        unmet: [...trigger.unmet, ...steps.flatMap((step) => step.unmet)],
    }
}

async function resolveComponent({ component, answers, connectionsOf }: { component: unknown, answers: LiveSettings['answers'], connectionsOf: (pieceName: string) => Promise<ListedConnections> }): Promise<{ component: unknown, unmet: string[] }> {
    if (!isObject(component) || typeof component['auth'] !== 'string' || component['auth'].length === 0 || typeof component['pieceName'] !== 'string') {
        return { component, unmet: [] }
    }
    const pieceName = agentWorkerTools.normalizePieceName(component['pieceName'])
    const reference = referenceOf(component['auth'])
    const listed = await connectionsOf(pieceName)
    if (!isNil(listed.error)) {
        return { component, unmet: [`could not list ${pieceName} connections to find "${reference}": ${listed.error}`] }
    }
    const externalId = externalIdFor({ reference, pieceName, connections: listed.connections, answers })
    return isNil(externalId)
        ? { component, unmet: [`needs connection "${reference}" (${pieceName})`] }
        : { component: { ...component, auth: externalId }, unmet: [] }
}

function externalIdFor({ reference, pieceName, connections, answers }: { reference: string, pieceName: string, connections: ProjectConnection[], answers: LiveSettings['answers'] }): string | null {
    const exact = connections.find((connection) => connection.externalId === reference) ?? connections.find((connection) => connection.displayName === reference)
    if (!isNil(exact)) {
        return exact.externalId
    }
    if (agentWorkerTools.normalizePieceName(reference) !== pieceName) {
        return null
    }
    const override = Object.entries(answers.connections).find(([piece]) => agentWorkerTools.normalizePieceName(piece) === pieceName)?.[1]
    if (override === NO_CONNECTION) {
        return null
    }
    return scriptedUser.pickConnection({ connections, override })?.externalId ?? null
}

function referenceOf(auth: string): string {
    const match = auth.trim().match(TEMPLATE_PATTERN)
    return match?.[1] ?? match?.[2] ?? match?.[3] ?? auth.trim()
}

async function listOnce({ pieceName, listConnections }: { pieceName: string, listConnections: (pieceName: string) => Promise<ProjectConnection[]> }): Promise<ListedConnections> {
    const { data, error } = await tryCatch(() => listConnections(pieceName))
    return isNil(error) ? { connections: data, error: null } : { connections: [], error: error.message }
}

const NO_CONNECTION = 'none'
const TEMPLATE_PATTERN = /^\{\{\s*connections?\s*(?::\s*(.+?)|\[\s*['"](.+?)['"]\s*\]|\.([\w-]+))\s*\}\}$/

export const seedConnections = {
    resolve,
    unmet,
}

type ListedConnections = { connections: ProjectConnection[], error: string | null }

type ResolveParams = {
    flows: SeedFlow[]
    answers: LiveSettings['answers']
    listConnections: (pieceName: string) => Promise<ProjectConnection[]>
}

export type ResolvedFlows = {
    flows: SeedFlow[]
    unmet: string[]
}
