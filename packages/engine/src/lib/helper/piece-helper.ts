import {
    DropdownProperty,
    DropdownState,
    DynamicProperties,
    DynamicPropsValue,
    MultiSelectDropdownProperty,
    PieceMetadata,
    PiecePropertyMap,
    PropertyType,
    StaticPropsValue,
} from '@activepieces/pieces-framework'
import {
    BasicAuthConnectionValue,
    CustomAuthConnectionValue,
    ExecuteExtractPieceMetadata,
    ExecutePropsOptions,
    ExecuteValidateAuthOperation,
    ExecuteValidateAuthResponse,
    OAuth2ConnectionValueWithApp,
    SecretTextConnectionValue,
} from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { createFlowsContext } from '../services/flows.service'
import { createPropsResolver } from '../variables/props-resolver'
import { pieceLoader } from './piece-loader'

export const pieceHelper = {
    async executeProps({ params, piecesSource, executionState, constants, searchValue }: ExecutePropsParams): Promise<ExecutePropsResult> {
        const property = await pieceLoader.getPropOrThrow({
            params,
            piecesSource,
        })

        try {
            const { resolvedInput } = await createPropsResolver({
                apiUrl: constants.internalApiUrl,
                projectId: params.projectId,
                engineToken: params.engineToken,
            }).resolve<
            StaticPropsValue<PiecePropertyMap>
            >({
                unresolvedInput: params.input,
                executionState,
            })
            const ctx = {
                searchValue,
                server: {
                    token: params.engineToken,
                    apiUrl: constants.internalApiUrl,
                    publicUrl: params.publicUrl,
                },
                project: {
                    id: params.projectId,
                    externalId: constants.externalProjectId,
                },
                flows: createFlowsContext(constants),
            }

            if (property.type === PropertyType.DYNAMIC) {
                const dynamicProperty = property as DynamicProperties<boolean>
                const props = await dynamicProperty.props(resolvedInput, ctx)
                return {
                    type: 'dynamicproperties',
                    options: props,
                }
            }

            if (property.type === PropertyType.MULTI_SELECT_DROPDOWN) {
                const multiSelectProperty = property as MultiSelectDropdownProperty<
                unknown,
                boolean
                >
                const options = await multiSelectProperty.options(resolvedInput, ctx)
                return {
                    type: 'dropdown',
                    options,
                }
            }

            const dropdownProperty = property as DropdownProperty<unknown, boolean>
            const options = await dropdownProperty.options(resolvedInput, ctx)
            return {
                type: 'dropdown',
                options,
            }
        }
        catch (e) {
            console.error(e)
            return {
                type: 'dropdown',
                options: {
                    disabled: true,
                    options: [],
                    placeholder: 'Throws an error, reconnect or refresh the page',
                },
            }
        }
    },

    async executeValidateAuth(
        { params, piecesSource }: { params: ExecuteValidateAuthOperation, piecesSource: string },
    ): Promise<ExecuteValidateAuthResponse> {
        const { piece: piecePackage } = params

        const piece = await pieceLoader.loadPieceOrThrow({ pieceName: piecePackage.pieceName, pieceVersion: piecePackage.pieceVersion, piecesSource })
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
            case PropertyType.OAUTH2: {
                const con = params.auth as OAuth2ConnectionValueWithApp
                return piece.auth.validate({
                    auth: con,
                })
            }
            default: {
                throw new Error('Invalid auth type')
            }
        }
    },

    async extractPieceMetadata({ piecesSource, params }: { piecesSource: string, params: ExecuteExtractPieceMetadata }): Promise<PieceMetadata> {
        const { pieceName, pieceVersion } = params
        const piece = await pieceLoader.loadPieceOrThrow({ pieceName, pieceVersion, piecesSource })

        return {
            ...piece.metadata(),
            name: pieceName,
            version: pieceVersion,
            authors: piece.authors,
        }
    },
}


type ExecutePropsParams = { searchValue?: string, executionState: FlowExecutorContext, params: ExecutePropsOptions, piecesSource: string, constants: EngineConstants }

type ExecutePropsResult = {
    type: 'dropdown'
    options: DropdownState<unknown>
} | {
    type: 'dynamicproperties'
    options: Record<string, DynamicPropsValue>
}
