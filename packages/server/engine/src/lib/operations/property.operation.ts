import { isNil, isObject } from '@activepieces/core-utils'
import { DropdownState, ExecutePropsResult, InputPropertyMap, PiecePropertyMap, PropertyType, StaticPropsValue } from '@activepieces/pieces-framework'
import {
    EngineGenericError,
    EngineResponse,
    EngineResponseStatus,
    ExecutePropsOptions,
} from '@activepieces/shared'
import * as z from 'zod/mini'
import { PieceDescription } from '../core/piece/piece-protocol'
import { pieceRunner } from '../core/piece/piece-runner'
import { EngineConstants } from '../handler/context/engine-constants'
import { testExecutionContext } from '../handler/context/test-execution-context'
import { buildRuntime } from '../handler/piece-executor'
import { dynamicPropKeys } from '../helper/dynamic-prop-keys'
import { utils } from '../utils'
import { createPropsResolver } from '../variables/props-resolver'

export const propertyOperation = {
    execute: async (operation: ExecutePropsOptions): Promise<EngineResponse<ExecutePropsResult<ExecutablePropertyType>>> => {
        return {
            status: EngineResponseStatus.OK,
            response: await executeProps(operation),
        }
    },
}

async function executeProps(operation: ExecutePropsOptions): Promise<ExecutePropsResult<ExecutablePropertyType>> {
    const constants = EngineConstants.fromExecutePropertyInput({
        ...operation,
        pieceName: operation.piece.pieceName,
        pieceVersion: operation.piece.pieceVersion,
    })
    const piece = {
        pieceName: operation.piece.pieceName,
        pieceVersion: operation.piece.pieceVersion,
        devPieces: EngineConstants.DEV_PIECES,
    }
    const description = await pieceRunner.describe(piece)
    const { propertyType, path } = resolvePropertyPath({ description, operation })

    const { data: result, error } = await utils.tryCatchAndThrowOnEngineError(async () => {
        const executionState = await testExecutionContext.stateFromFlowVersion({
            apiUrl: operation.internalApiUrl,
            flowVersion: operation.flowVersion,
            projectId: operation.projectId,
            engineToken: operation.engineToken,
            sampleData: operation.sampleData,
            engineConstants: constants,
        })
        const contextVersion = description.metadata.contextInfo?.version
        const { resolvedInput } = await createPropsResolver({
            apiUrl: constants.internalApiUrl,
            projectId: constants.projectId,
            engineToken: constants.engineToken,
            contextVersion,
            stepNames: constants.stepNames,
            pieceName: piece.pieceName,
        }).resolve<StaticPropsValue<PiecePropertyMap>>({
            unresolvedInput: operation.input,
            executionState,
        })
        const { result } = await pieceRunner.call({
            piece,
            path,
            context: {
                kind: 'props',
                runtime: buildRuntime({ constants, pieceName: piece.pieceName, contextVersion }),
                stepName: operation.actionOrTriggerName,
                resolvedInput,
                searchValue: operation.searchValue,
            },
        })
        return result

    })

    if (error) {
        console.error(error)
        return {
            type: propertyType,
            options: {
                disabled: true,
                options: [],
                placeholder: 'Throws an error, reconnect or refresh the page',
            },
        }
    }
    return toPropsResult({ propertyType, result })
}

function resolvePropertyPath({ description, operation }: ResolvePropertyPathParams): { propertyType: ExecutablePropertyType, path: string[] } {
    const { actionOrTriggerName, propertyName } = operation
    const root = isNil(description.metadata.actions[actionOrTriggerName]) ? 'triggers' : 'actions'
    const step = description.metadata[root][actionOrTriggerName]
    const property = step?.props[propertyName]
    if (isNil(property)) {
        throw new EngineGenericError('PropertyNotFoundError', `Property not found: ${actionOrTriggerName}.${propertyName}`)
    }
    if (property.type !== PropertyType.DROPDOWN && property.type !== PropertyType.MULTI_SELECT_DROPDOWN && property.type !== PropertyType.DYNAMIC) {
        throw new EngineGenericError('PropertyTypeNotExecutableError', `Property type is not executable: ${property.type} for ${property.displayName}`)
    }
    return {
        propertyType: property.type,
        path: [root, actionOrTriggerName, 'props', propertyName, property.type === PropertyType.DYNAMIC ? 'props' : 'options'],
    }
}

function toPropsResult({ propertyType, result }: { propertyType: ExecutablePropertyType, result: unknown }): ExecutePropsResult<ExecutablePropertyType> {
    if (propertyType === PropertyType.DYNAMIC) {
        return {
            type: propertyType,
            options: dynamicPropKeys.escapePropsKeys(toInputPropertyMap(result)),
        }
    }
    return {
        type: propertyType,
        options: toDropdownState(result),
    }
}

function toInputPropertyMap(result: unknown): InputPropertyMap {
    return DynamicProps.safeParse(result).data ?? {}
}

function toDropdownState(result: unknown): DropdownState<unknown> {
    return DropdownResult.safeParse(result).data ?? { disabled: false, options: [] }
}

const DynamicProps = z.custom<InputPropertyMap>((value) => isObject(value))
const DropdownResult = z.custom<DropdownState<unknown>>((value) => isObject(value) && Array.isArray(Reflect.get(value, 'options')))

type ExecutablePropertyType = PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN | PropertyType.DYNAMIC

type ResolvePropertyPathParams = {
    description: PieceDescription
    operation: ExecutePropsOptions
}
