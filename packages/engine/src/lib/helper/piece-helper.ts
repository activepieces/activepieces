import {
    DropdownProperty,
    DynamicProperties,
    ExecutePropsResult,
    getAuthPropertyForValue,
    MultiSelectDropdownProperty,
    PieceAuthProperty,
    PieceMetadata,
    PiecePropertyMap,
    pieceTranslation,
    PropertyType,
    StaticPropsValue } from '@activepieces/pieces-framework'
import {
    AppConnectionType,
    AppConnectionValue,
    EngineGenericError,
    ExecuteExtractPieceMetadata,
    ExecutePropsOptions,
    ExecuteValidateAuthOperation,
    ExecuteValidateAuthResponse,
    isNil,
} from '@activepieces/shared'
import { EngineConstants } from '../handler/context/engine-constants'
import { testExecutionContext } from '../handler/context/test-execution-context'
import { createFlowsContext } from '../services/flows.service'
import { utils } from '../utils'
import { createPropsResolver } from '../variables/props-resolver'
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
        const { property, piece } = await pieceLoader.getPropOrThrow({ pieceName: operation.pieceName, pieceVersion: operation.pieceVersion, actionOrTriggerName: operation.actionOrTriggerName, propertyName: operation.propertyName, devPieces: EngineConstants.DEV_PIECES })
    
        if (property.type !== PropertyType.DROPDOWN && property.type !== PropertyType.MULTI_SELECT_DROPDOWN && property.type !== PropertyType.DYNAMIC) {
            throw new EngineGenericError('PropertyTypeNotExecutableError', `Property type is not executable: ${property.type} for ${property.displayName}`)
        }
        const { data: executePropsResult, error: executePropsError } = await utils.tryCatchAndThrowOnEngineError((async (): Promise<ExecutePropsResult<PropertyType.DROPDOWN | PropertyType.MULTI_SELECT_DROPDOWN | PropertyType.DYNAMIC>> => {
            const { resolvedInput } = await createPropsResolver({
                apiUrl: constants.internalApiUrl,
                projectId: constants.projectId,
                engineToken: constants.engineToken,
                contextVersion: piece.getContextInfo?.().version,
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
                    contextVersion: piece.getContextInfo?.().version,
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
        return  validateAuth({
            authValue: params.auth,
            pieceAuth: piece.auth,
            server,
        })

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


function mismatchAuthTypeErrorMessage(pieceAuthType: PropertyType, connectionType: AppConnectionType): ExecuteValidateAuthResponse {
    return {
        valid: false,
        error: `Connection value type does not match piece auth type: ${pieceAuthType} !== ${connectionType}`,
    }
}

const validateAuth = async ({
    server,
    authValue,
    pieceAuth,
}: ValidateAuthParams): Promise<ExecuteValidateAuthResponse> => {
    if (isNil(pieceAuth)) {
        return {
            valid: true,
        }
    }
    const usedPieceAuth = getAuthPropertyForValue({
        authValueType: authValue.type,
        pieceAuth,
    })

    if (isNil(usedPieceAuth)) {
        return {
            valid: false,
            error: 'No piece auth found for auth value',
        }
    }
    if (isNil(usedPieceAuth.validate)) {
        return {
            valid: true,
        }
    }
  

    switch (usedPieceAuth.type) {
        case PropertyType.OAUTH2:{
            if (authValue.type !== AppConnectionType.OAUTH2 && authValue.type !== AppConnectionType.CLOUD_OAUTH2 && authValue.type !== AppConnectionType.PLATFORM_OAUTH2) {
                return mismatchAuthTypeErrorMessage(usedPieceAuth.type, authValue.type)
            }
            return usedPieceAuth.validate({
                auth: authValue,
                server,
            })
        }
        case PropertyType.BASIC_AUTH:{
            if (authValue.type !== AppConnectionType.BASIC_AUTH) {
                return mismatchAuthTypeErrorMessage(usedPieceAuth.type, authValue.type)
            }
            return usedPieceAuth.validate({
                auth: authValue,
                server,
            })
        }
        case PropertyType.SECRET_TEXT:{
            if (authValue.type !== AppConnectionType.SECRET_TEXT) {
                return mismatchAuthTypeErrorMessage(usedPieceAuth.type, authValue.type)
            }
            return usedPieceAuth.validate({
                auth: authValue.secret_text,
                server,
            })
        }
        case PropertyType.CUSTOM_AUTH:{
            if (authValue.type !== AppConnectionType.CUSTOM_AUTH) {
                return mismatchAuthTypeErrorMessage(usedPieceAuth.type, authValue.type)
            }
            return usedPieceAuth.validate({
                auth: authValue.props,
                server,
            })
        }
        default: {
            throw new EngineGenericError('InvalidAuthTypeError', 'Invalid auth type')
        }
    }
}

type ValidateAuthParams = {
    server: {
        apiUrl: string
        publicUrl: string
    }
    authValue: AppConnectionValue
    pieceAuth: PieceAuthProperty | PieceAuthProperty[] | undefined
}