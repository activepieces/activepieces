import { omit } from '@activepieces/core-utils'
import { PiecePropertyMap } from '@activepieces/pieces-framework'
import { DynamicSchemaResolver, pieceInputPlan } from './piece-input-plan'

function createDynamicSchemaResolver({ actionName, connectionExternalId, resolveProps }: {
    actionName: string
    connectionExternalId?: string
    resolveProps: PropsResolution
}): DynamicSchemaResolver {
    return async ({ propertyName, resolvedInput }) => {
        const result = await resolveProps({
            propertyName,
            actionOrTriggerName: actionName,
            input: omit(resolvedInput, ['auth']),
            ...(connectionExternalId ? { auth: connectionExternalId } : {}),
        })
        if (result.status !== 'dynamic') {
            throw new Error(`Could not resolve the sub-fields of "${propertyName}": ${result.status === 'failed' ? result.message : 'the piece returned options rather than fields'}`)
        }
        return pieceInputPlan.schemaForProperties({
            properties: result.props,
            resolvedInput,
            resolveDynamic: createDynamicSchemaResolver({ actionName, connectionExternalId, resolveProps }),
        })
    }
}

export const pieceDynamicResolver = {
    createDynamicSchemaResolver,
}

export type PropsResolution = (params: {
    propertyName: string
    actionOrTriggerName: string
    input: Record<string, unknown>
    auth?: string
}) => Promise<PropsResolutionResult>

export type PropsResolutionResult =
    | { status: 'dynamic', props: PiecePropertyMap }
    | { status: 'options' }
    | { status: 'failed', message: string }
