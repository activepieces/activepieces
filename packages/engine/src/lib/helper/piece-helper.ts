import {
    Action,
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
    extractPieceFromModule,
    ExecuteValidateAuthOperation,
    ExecuteValidateAuthResponse,
    BasicAuthConnectionValue,
    SecretTextConnectionValue,
    CustomAuthConnectionValue,
    ExecuteExtractPieceMetadata,
    getPackageAliasForPiece,
    ExecutePropsOptions,
} from '@activepieces/shared'
import { isNil } from '@activepieces/shared'
import { API_URL } from '../constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { variableService } from '../services/variable-service'

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


    // TODO REIMPLMENT or use executor
    async executeAction(_params: ExecuteActionOperation): Promise<ExecuteActionResponse> {
        return {} as unknown as ExecuteActionResponse
    },

    async executeProps(params: ExecutePropsOptions) {
        const property = await getPropOrThrow(params)

        try {
            const { resolvedInput } = await variableService({
                projectId: params.projectId,
                workerToken: params.workerToken,
            }).resolve<
            StaticPropsValue<PiecePropertyMap>
            >({
                unresolvedInput: params.input,
                // TODO FIX
                executionState: FlowExecutorContext.empty(),
            })
            const ctx = {
                server: {
                    token: params.workerToken,
                    apiUrl: API_URL,
                    publicUrl: params.serverUrl,
                },
            }

            if (property.type === PropertyType.DYNAMIC) {
                const dynamicProperty = property as DynamicProperties<boolean>
                return dynamicProperty.props(resolvedInput, ctx)
            }

            if (property.type === PropertyType.MULTI_SELECT_DROPDOWN) {
                const multiSelectProperty = property as MultiSelectDropdownProperty<
                unknown,
                boolean
                >
                return multiSelectProperty.options(resolvedInput, ctx)
            }

            const dropdownProperty = property as DropdownProperty<unknown, boolean>
            return dropdownProperty.options(resolvedInput, ctx)
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
    getActionOrThrow,
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
