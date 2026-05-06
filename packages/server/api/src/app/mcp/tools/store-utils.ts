import { ProjectId } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { z } from 'zod'
import { flowService } from '../../flows/flow/flow.service'

export async function resolveStoreKey(params: ResolveStoreKeyParams): Promise<string> {
    const { key, scope } = params
    if (scope === 'PROJECT') {
        return key
    }

    const flowId = await validateFlowScope(params)
    return `flow_${flowId}/${key}`
}

export function formatStoreLocation({ key, scope, flowId }: FormatStoreLocationParams): string {
    if (scope === 'PROJECT') {
        return `key "${key}" in PROJECT scope`
    }
    return `key "${key}" in FLOW scope for flow "${flowId}"`
}

export function formatStoreValue(value: unknown): string {
    if (value === undefined) {
        return 'undefined'
    }

    const serializedValue = JSON.stringify(value, null, 2)
    return serializedValue ?? 'undefined'
}

async function validateFlowScope({
    flowId,
    projectId,
    log,
}: ResolveStoreKeyParams): Promise<string> {
    if (!flowId) {
        throw new Error('flowId is required when scope is FLOW.')
    }

    const flow = await flowService(log).getOne({
        id: flowId,
        projectId,
    })

    if (!flow) {
        throw new Error(`Flow "${flowId}" not found in the current project.`)
    }

    return flowId
}

export const storeScopeSchema = z.enum(['PROJECT', 'FLOW'])

type ResolveStoreKeyParams = {
    key: string
    scope: StoreToolScope
    flowId?: string
    projectId: ProjectId
    log: FastifyBaseLogger
}

type FormatStoreLocationParams = {
    key: string
    scope: StoreToolScope
    flowId?: string
}

export type StoreToolScope = z.infer<typeof storeScopeSchema>
