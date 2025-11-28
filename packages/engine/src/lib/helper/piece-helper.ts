import {
    DropdownProperty,
    DynamicProperties,
    ExecutePropsResult,
    MultiSelectDropdownProperty,
    PieceMetadata,
    PiecePropertyMap,
    pieceTranslation,
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
import { testExecutionContext } from '../handler/context/test-execution-context'
import { createFlowsContext } from '../services/flows.service'
import { utils } from '../utils'
import { createPropsResolver } from '../variables/props-resolver'
import { EngineGenericError } from './execution-errors'
import { pieceLoader } from './piece-loader'

export const pieceHelper = {
    async executeProps( operation: ExecutePropsParams): Promise<ExecutePropsResult<PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN | PropertyType.DYNAMIC>> {
        const constants = EngineConstants.fromExecutePropertyInput(operation)
        const executionState = await testExecutionContext.stateFromFlowVersion({
            apiUrl: operation.internalApiUrl,
            flowVersion: operation.flowVersion,
            projectId: operation.projectId,
            engineToken: operation.engineToken,
            sampleData: operation.sampleData,
        })
        const property = await pieceLoader.getPropOrThrow({ pieceName: operation.pieceName, pieceVersion: operation.pieceVersion, actionOrTriggerName: operation.actionOrTriggerName, propertyName: operation.propertyName, devPieces: EngineConstants.DEV_PIECES })
    
        if (property.type !== PropertyType.DROPDOWN && property.type !== PropertyType.MULTI_SELECT_DROPDOWN && property.type !== PropertyType.DYNAMIC) {
            throw new EngineGenericError('PropertyTypeNotExecutableError', `Property type is not executable: ${property.type} for ${property.displayName}`)
        }

        const { data: executePropsResult, error: executePropsError } = await utils.tryCatchAndThrowOnEngineError((async (): Promise<ExecutePropsResult<PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN | PropertyType.DYNAMIC>> => {
            const { resolvedInput } = await createPropsResolver({
                apiUrl: constants.internalApiUrl,
                projectId: constants.projectId,
                engineToken: constants.engineToken,
            }).resolve<
            StaticPropsValue<PiecePropertyMap>
            >({
                unresolvedInput: operation.input,
                executionState,
            })
            const ctx = {
                searchValue: operation.searchValue,
                server: {
                    token: constants.engineToken,
                    apiUrl: constants.internalApiUrl,
                    publicUrl: operation.publicApiUrl,
                },
                project: {
                    id: constants.projectId,
                    externalId: constants.externalProjectId,
                },
                flows: createFlowsContext(constants),
                step: {
                    name: operation.actionOrTriggerName,
                },
                connections: utils.createConnectionManager({
                    projectId: constants.projectId,
                    engineToken: constants.engineToken,
                    apiUrl: constants.internalApiUrl,
                    target: 'properties',
                }),
            }
        
            switch (property.type) {
                case PropertyType.DYNAMIC: {
                    const dynamicProperty = property as DynamicProperties<boolean>
                    const props = await dynamicProperty.props(resolvedInput, ctx)
                    return {
                        type: PropertyType.DYNAMIC,
                        options: props,
                    }
                }
                case PropertyType.MULTI_SELECT_DROPDOWN: {
                    const multiSelectProperty = property as MultiSelectDropdownProperty<
                    unknown,
                    boolean
                    >
                    const options = await multiSelectProperty.options(resolvedInput, ctx)
                    return {
                        type: PropertyType.MULTI_SELECT_DROPDOWN,
                        options,
                    }
                }
                case PropertyType.DROPDOWN: {
                    const dropdownProperty = property as DropdownProperty<unknown, boolean>
                    const options = await dropdownProperty.options(resolvedInput, ctx)
                    return {
                        type: PropertyType.DROPDOWN,
                        options,
                    }
                }
                default: {
                    throw new EngineGenericError('PropertyTypeNotExecutableError', `Property type is not executable: ${property}`)
                }
            }
        }))
        
        if (executePropsError) {
            console.error(executePropsError)
            return {
                type: property.type,
                options: {
                    disabled: true,
                    options: [],
                    placeholder: 'Throws an error, reconnect or refresh the page',
                },
            }
        }

        return executePropsResult
    },

    async executeValidateAuth(
        { params, devPieces }: { params: ExecuteValidateAuthOperation, devPieces: string[] },
    ): Promise<ExecuteValidateAuthResponse> {
        const { piece: piecePackage } = params

        const piece = await pieceLoader.loadPieceOrThrow({ pieceName: piecePackage.pieceName, pieceVersion: piecePackage.pieceVersion, devPieces })
        const server = {
            apiUrl: params.internalApiUrl.endsWith('/') ? params.internalApiUrl : params.internalApiUrl + '/',
            publicUrl: params.publicApiUrl,
        }
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
                    server,
                })
            }
            case PropertyType.SECRET_TEXT: {
                const con = params.auth as SecretTextConnectionValue
                return piece.auth.validate({
                    auth: con.secret_text,
                    server,
                })
            }
            case PropertyType.CUSTOM_AUTH: {
                const con = params.auth as CustomAuthConnectionValue
                return piece.auth.validate({
                    auth: con.props,
                    server,
                })
            }
            case PropertyType.OAUTH2: {
                const con = params.auth as OAuth2ConnectionValueWithApp
                return piece.auth.validate({
                    auth: con,
                    server,
                })
            }
            default: {
                throw new EngineGenericError('InvalidAuthTypeError', 'Invalid auth type')
            }
        }
    },

    async extractPieceMetadata({ devPieces, params }: { devPieces: string[], params: ExecuteExtractPieceMetadata }): Promise<PieceMetadata> {
        const { pieceName, pieceVersion } = params
        const piece = await pieceLoader.loadPieceOrThrow({ pieceName, pieceVersion, devPieces })
        const pieceAlias = pieceLoader.getPackageAlias({ pieceName, pieceVersion, devPieces })
        const pieceFolderPath = await pieceLoader.getPiecePath({ packageName: pieceAlias, devPieces })
        const i18n = await pieceTranslation.initializeI18n(pieceFolderPath)
        const fullMetadata = piece.metadata()
        return {
            ...fullMetadata,
            name: pieceName,
            version: pieceVersion,
            authors: piece.authors,
            i18n,
        }
    },
}

type ExecutePropsParams = Omit<ExecutePropsOptions, 'piece'> & { pieceName: string, pieceVersion: string }

