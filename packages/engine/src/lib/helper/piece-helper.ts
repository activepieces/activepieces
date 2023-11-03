import {
    Action,
    ActionContext,
    DropdownProperty,
    DropdownState,
    DynamicProperties,
    MultiSelectDropdownProperty,
    Piece,
    PieceMetadata,
    PiecePropertyMap,
    PropertyType,
    StaticPropsValue,
} from '@activepieces/pieces-framework'
import {
    ActivepiecesError,
    ErrorCode,
    ExecuteActionOperation,
    ExecuteActionResponse,
    ExecuteCodeOperation,
    ExecutePropsOptions,
    ExecutionState,
    ExecutionType,
    extractPieceFromModule,
    AUTHENTICATION_PROPERTY_NAME,
    ExecuteValidateAuthOperation,
    ExecuteValidateAuthResponse,
    BasicAuthConnectionValue,
    SecretTextConnectionValue,
    CustomAuthConnectionValue,
    ExecuteExtractPieceMetadata,
    getPackageAliasForPiece,
} from '@activepieces/shared'
import { VariableService } from '../services/variable-service'
import { isNil } from '@activepieces/shared'
import { createContextStore } from '../services/storage.service'
import { globals } from '../globals'
import { connectionService } from '../services/connections.service'
import { utils } from '../utils'
import { codeExecutor } from '../executors/code-executer'
import { createTagsManager } from '../services/tags.service'
import { testExecution } from './test-execution-context'
import { createFilesService } from '../services/files.service'

const variableService = new VariableService()
const env = process.env.AP_ENVIRONMENT

const loadPieceOrThrow = async (
    pieceName: string,
    pieceVersion: string,
): Promise<Piece> => {
    const packageName = getPackageAlias({
        pieceName,
        pieceVersion,
    })

    const module = await import(packageName)
    const piece = extractPieceFromModule<Piece>({
        module,
        pieceName,
        pieceVersion,
    })

    if (isNil(piece)) {
        throw new ActivepiecesError({
            code: ErrorCode.PIECE_NOT_FOUND,
            params: {
                pieceName,
                pieceVersion,
            },
        })
    }

    return piece
}

const getActionOrThrow = async (params: GetActionParams): Promise<Action> => {
    const { pieceName, pieceVersion, actionName } = params

    const piece = await loadPieceOrThrow(pieceName, pieceVersion)

    const action = piece.getAction(actionName)

    if (isNil(action)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                pieceName,
                pieceVersion,
                stepName: actionName,
            },
        })
    }

    return action
}

const getPropOrThrow = async (params: ExecutePropsOptions) => {
    const { piece: piecePackage, stepName, propertyName } = params

    const piece = await loadPieceOrThrow(piecePackage.pieceName, piecePackage.pieceVersion)

    const action = piece.getAction(stepName) ?? piece.getTrigger(stepName)

    if (isNil(action)) {
        throw new ActivepiecesError({
            code: ErrorCode.STEP_NOT_FOUND,
            params: {
                pieceName: piecePackage.pieceName,
                pieceVersion: piecePackage.pieceVersion,
                stepName,
            },
        })
    }

    const prop = action.props[propertyName]

    if (isNil(prop)) {
        throw new ActivepiecesError({
            code: ErrorCode.CONFIG_NOT_FOUND,
            params: {
                pieceName: piecePackage.pieceName,
                pieceVersion: piecePackage.pieceVersion,
                stepName,
                configName: propertyName,
            },
        })
    }

    return prop
}

export const pieceHelper = {
    async executeCode(params: ExecuteCodeOperation): Promise<ExecuteActionResponse> {
        const { step, input, flowVersion } = params

        const executionState = await testExecution.stateFromFlowVersion({
            flowVersion,
        })

        const resolvedInput = await variableService.resolve({
            unresolvedInput: input,
            executionState,
            logs: false,
        })

        try {

            const result = await codeExecutor.executeCode({
                params: resolvedInput,
                stepName: step.name,
            })
            return {
                success: true,
                output: result,
            }
        }
        catch (e) {
            // Don't remove this console.error, it's used in the UI to display the error
            console.error(e)
            return {
                success: false,
                output: undefined,
            }
        }
    },

    async executeAction(params: ExecuteActionOperation): Promise<ExecuteActionResponse> {
        const { piece: piecePackage, actionName, input, flowVersion } = params

        const action = await getActionOrThrow({
            pieceName: piecePackage.pieceName,
            pieceVersion: piecePackage.pieceVersion,
            actionName,
        })

        const piece = await pieceHelper.loadPieceOrThrow(piecePackage.pieceName, piecePackage.pieceVersion)

        const executionState = await testExecution.stateFromFlowVersion({
            flowVersion,
        })

        const resolvedProps = await variableService.resolve<
        StaticPropsValue<PiecePropertyMap>
        >({
            unresolvedInput: input,
            executionState,
            logs: false,
        })

        try {
            const { processedInput, errors } =
                await variableService.applyProcessorsAndValidators(
                    resolvedProps,
                    action.props,
                    piece.auth,
                )
            if (Object.keys(errors).length > 0) {
                throw new Error(JSON.stringify(errors))
            }

            const context: ActionContext = {
                executionType: ExecutionType.BEGIN,
                auth: processedInput[AUTHENTICATION_PROPERTY_NAME],
                propsValue: processedInput,
                server: {
                    token: globals.workerToken!,
                    apiUrl: globals.apiUrl!,
                    publicUrl: globals.serverUrl!,
                },
                files: createFilesService({
                    stepName: actionName,
                    flowId: flowVersion.flowId,
                    type: 'db',
                }),
                tags: createTagsManager(executionState),
                store: createContextStore('', flowVersion.flowId),
                connections: {
                    get: async (key: string) => {
                        try {
                            const connection = await connectionService.obtain(key)
                            if (!connection) {
                                return null
                            }
                            return connection
                        }
                        catch (e) {
                            return null
                        }
                    },
                },
                serverUrl: globals.serverUrl!,
                run: {
                    id: 'test-flow-run-id',
                    stop: () => console.info('stopHook called!'),
                    pause: () => console.info('pauseHook called!'),
                },
            }

            // Legacy Code doesn't have test function
            if (!isNil(action.test)) {
                return {
                    output: await action.test(context),
                    success: true,
                }
            }
            return {
                output: await action.run(context),
                success: true,
            }
        }
        catch (e) {
            return {
                output: e instanceof Error ? await utils.tryParseJson(e.message) : e,
                success: false,
            }
        }
    },

    async executeProps(params: ExecutePropsOptions) {
        const property = await getPropOrThrow(params)

        try {
            const resolvedProps = await variableService.resolve<
            StaticPropsValue<PiecePropertyMap>
            >({
                unresolvedInput: params.input,
                executionState: new ExecutionState(),
                logs: false,
            })
            const ctx = {
                server: {
                    token: globals.workerToken!,
                    apiUrl: globals.apiUrl!,
                    publicUrl: globals.serverUrl!,
                },
            }

            if (property.type === PropertyType.DYNAMIC) {
                const dynamicProperty = property as DynamicProperties<boolean>
                return dynamicProperty.props(resolvedProps, ctx)
            }

            if (property.type === PropertyType.MULTI_SELECT_DROPDOWN) {
                const multiSelectProperty = property as MultiSelectDropdownProperty<
                unknown,
                boolean
                >
                return multiSelectProperty.options(resolvedProps, ctx)
            }

            const dropdownProperty = property as DropdownProperty<unknown, boolean>
            return dropdownProperty.options(resolvedProps, ctx)
        }
        catch (e) {
            console.error(e)
            return {
                disabled: true,
                options: [],
                placeholder: 'Throws an error, reconnect or refresh the page',
            } as DropdownState<unknown>
        }
    },

    async executeValidateAuth(
        params: ExecuteValidateAuthOperation,
    ): Promise<ExecuteValidateAuthResponse> {
        const { piece: piecePackage } = params

        const piece = await loadPieceOrThrow(piecePackage.pieceName, piecePackage.pieceVersion)
        if (piece.auth?.validate === undefined) {
            return {
                valid: true,
            }
        }

        switch (piece.auth.type) {
            case PropertyType.BASIC_AUTH: {
                const con = params.auth as BasicAuthConnectionValue
                return piece.auth.validate({
                    auth: {
                        username: con.username,
                        password: con.password,
                    },
                })
            }
            case PropertyType.SECRET_TEXT: {
                const con = params.auth as SecretTextConnectionValue
                return piece.auth.validate({
                    auth: con.secret_text,
                })
            }
            case PropertyType.CUSTOM_AUTH: {
                const con = params.auth as CustomAuthConnectionValue
                return piece.auth.validate({
                    auth: con.props,
                })
            }
            default: {
                throw new Error('Invalid auth type')
            }
        }
    },

    async extractPieceMetadata(params: ExecuteExtractPieceMetadata): Promise<PieceMetadata> {
        const { pieceName, pieceVersion } = params
        const piece = await loadPieceOrThrow(pieceName, pieceVersion)

        return {
            ...piece.metadata(),
            name: pieceName,
            version: pieceVersion,
        }
    },

    loadPieceOrThrow,
}

const getPackageAlias = ({ pieceName, pieceVersion }: GetPackageAliasParams) => {
    if (env === 'dev') {
        return pieceName
    }

    return getPackageAliasForPiece({
        pieceName,
        pieceVersion,
    })
}

type GetPackageAliasParams = {
    pieceName: string
    pieceVersion: string
}

type GetActionParams = {
    pieceName: string
    pieceVersion: string
    actionName: string
}
