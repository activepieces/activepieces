/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    ErrorMessages,
    formatErrorMessage,
    InputPropertyMap,
    PieceAuthProperty,
    PropertyType,
} from '@activepieces/pieces-framework'
import {
    AUTHENTICATION_PROPERTY_NAME,
    isNil,
    isString,
} from '@activepieces/shared'
import replaceAsync from 'string-replace-async'
import { initCodeSandbox } from '../core/code/code-sandbox'
import { FlowExecutorContext } from '../handler/context/flow-execution-context'
import { createConnectionService } from './connections.service'
import { handleAPFile, isApFilePath } from './files.service'

export class VariableService {
    private static readonly VARIABLE_PATTERN = RegExp('\\{\\{(.*?)\\}\\}', 'g')
    private static readonly CONNECTIONS = 'connections'

    private workerToken: string
    private projectId: string

    constructor(data: { workerToken: string, projectId: string }) {
        this.workerToken = data.workerToken
        this.projectId = data.projectId
    }

    private async resolveInput(
        input: string,
        valuesMap: Record<string, unknown>,
        logs: boolean,
    ): Promise<unknown> {
        // If input contains only a variable token, return the value of the variable while maintaining the variable type.
        const matchedTokens = input.match(VariableService.VARIABLE_PATTERN)
        if (
            matchedTokens !== null &&
            matchedTokens.length === 1 &&
            matchedTokens[0] === input
        ) {
            const variableName = input.substring(2, input.length - 2)
            if (variableName.startsWith(VariableService.CONNECTIONS)) {
                return this.handleTypeAndResolving(variableName, logs)
            }
            return this.evalInScope(variableName, valuesMap)
        }

        return replaceAsync(input, VariableService.VARIABLE_PATTERN, async (_fullMatch, variableName) => {
            const result = await this.evalInScope(variableName, valuesMap)

            if (!isString(result)) {
                return JSON.stringify(result)
            }

            return result
        })
    }

    private async handleTypeAndResolving(
        path: string,
        censorConnections: boolean,
    ): Promise<unknown> {
        // Need to be resolved dynamically
        const connectionName = this.findConnectionName(path)
        if (isNil(connectionName)) {
            return ''
        }
        if (censorConnections) {
            return '**REDACTED**'
        }
        // Need to be resolved dynamically
        // Replace connection name with something that doesn't contain - or _, otherwise evalInScope would break
        const newPath = this.cleanPath(path, connectionName)

        const connection = await createConnectionService({ workerToken: this.workerToken, projectId: this.projectId }).obtain(connectionName)
        if (newPath.length === 0) {
            return connection
        }
        const context: Record<string, unknown> = {}
        context.connection = connection
        return this.evalInScope(newPath, context)
    }

    private cleanPath(path: string, connectionName: string): string {
        if (path.includes('[')) {
            return path.substring(`connections.['${connectionName}']`.length)
        }
        const cp = path.substring(`connections.${connectionName}`.length)
        if (cp.length === 0) {
            return cp
        }
        return `connection${cp}`
    }

    private findConnectionName(path: string): string | null {
        const paths = path.split('.')
        // Connections with square brackets
        if (path.includes('[')) {
            // Find the connection name inside {{connections['connectionName'].path}}
            const matches = path.match(/\['([^']+)'\]/g)
            if (matches && matches.length >= 1) {
                // Remove the square brackets and quotes from the connection name
                const secondPath = matches[0].replace(/\['|'\]/g, '')
                return secondPath
            }
            return null
        }
        return paths[1]
    }

    private async evalInScope(js: string, contextAsScope: Record<string, unknown>): Promise<unknown> {
        try {
            const codeSandbox = await initCodeSandbox()

            const result = await codeSandbox.runScript({
                script: js,
                scriptContext: contextAsScope,
            })

            return result ?? ''
        }
        catch (exception) {
            return ''
        }
    }

    private async resolveInternally(
        unresolvedInput: any,
        valuesMap: any,
        logs: boolean,
    ): Promise<any> {
        if (isNil(unresolvedInput)) {
            return unresolvedInput
        }

        if (isString(unresolvedInput)) {
            return this.resolveInput(unresolvedInput, valuesMap, logs)
        }

        if (Array.isArray(unresolvedInput)) {
            for (let i = 0; i < unresolvedInput.length; ++i) {
                unresolvedInput[i] = await this.resolveInternally(
                    unresolvedInput[i],
                    valuesMap,
                    logs,
                )
            }
        }
        else if (typeof unresolvedInput === 'object') {
            const entries = Object.entries(unresolvedInput)
            for (const [key, value] of entries) {
                unresolvedInput[key] = await this.resolveInternally(
                    value,
                    valuesMap,
                    logs,
                )
            }
        }

        return unresolvedInput
    }
    async resolve<T = unknown>(params: {
        unresolvedInput: unknown
        executionState: FlowExecutorContext
    }): Promise<{
            resolvedInput: T
            censoredInput: unknown
        }> {
        const { unresolvedInput, executionState } = params

        if (isNil(unresolvedInput)) {
            return {
                resolvedInput: unresolvedInput as unknown as T,
                censoredInput: unresolvedInput as unknown,
            }
        }

        const resolvedInput = await this.resolveInternally(
            JSON.parse(JSON.stringify(unresolvedInput)),
            executionState.currentState,
            false,
        )
        const censoredInput = await this.resolveInternally(
            JSON.parse(JSON.stringify(unresolvedInput)),
            executionState.currentState,
            true,
        )
        return {
            resolvedInput,
            censoredInput,
        }
    }

    async applyProcessorsAndValidators(
        resolvedInput: Record<string, any>,
        props: InputPropertyMap,
        auth: PieceAuthProperty | undefined,
    ): Promise<{ processedInput: any, errors: any }> {
        const processedInput = { ...resolvedInput }
        const errors: Record<string, unknown> = {}

        if (auth && auth.type === PropertyType.CUSTOM_AUTH) {
            const { processedInput: authProcessedInput, errors: authErrors } =
                await this.applyProcessorsAndValidators(
                    resolvedInput[AUTHENTICATION_PROPERTY_NAME],
                    auth.props,
                    undefined,
                )
            processedInput.auth = authProcessedInput
            if (Object.keys(authErrors).length > 0) {
                errors.auth = authErrors
            }
        }
        for (const [key, value] of Object.entries(resolvedInput)) {
            const property = props[key]
            if (key === AUTHENTICATION_PROPERTY_NAME) {
                continue
            }
            if (property.type === PropertyType.MARKDOWN) {
                continue
            }
            const processors = [
                ...(property.defaultProcessors ?? []),
                ...(property.processors ?? []),
            ]
            const validators = [
                ...(property.defaultValidators ?? []),
                ...(property.validators ?? []),
            ]
            // TODO remove the hard coding part
            if (property.type === PropertyType.FILE && isApFilePath(value)) {
                processedInput[key] = await handleAPFile({
                    path: value.trim(),
                    workerToken: this.workerToken,
                })
            }
            else {
                for (const processor of processors) {
                    processedInput[key] = await processor(property, value)
                }
            }

            const propErrors = []
            // Short Circuit
            // If the value is required, we don't allow it to be undefined or null
            if (isNil(value) && property.required) {
                errors[key] = [
                    formatErrorMessage(ErrorMessages.REQUIRED, { userInput: value }),
                ]
                continue
            }
            // If the value is not required, we allow it to be undefined or null
            if (isNil(value) && !property.required) continue

            for (const validator of validators) {
                const error = validator.fn(property, processedInput[key], value)
                if (!isNil(error)) propErrors.push(error)
            }
            if (propErrors.length) errors[key] = propErrors
        }
        return { processedInput, errors }
    }

}

export const variableService = ({ projectId, workerToken }: { projectId: string, workerToken: string }) => new VariableService({ projectId, workerToken })
