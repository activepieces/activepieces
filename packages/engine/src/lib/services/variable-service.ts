/* eslint-disable @typescript-eslint/no-explicit-any */
import {
    AUTHENTICATION_PROPERTY_NAME,
    ExecutionState,
    isNil,
    isString,
} from '@activepieces/shared'
import { connectionService } from './connections.service'
import {
    PropertyType,
    formatErrorMessage,
    ErrorMessages,
    PieceAuthProperty,
    NonAuthPiecePropertyMap,
} from '@activepieces/pieces-framework'
import { handleAPFile, isApFilePath } from './files.service'

export class VariableService {
    private VARIABLE_TOKEN = RegExp('\\{\\{(.*?)\\}\\}', 'g')
    private static CONNECTIONS = 'connections'

    private async resolveInput(
        input: string,
        valuesMap: Record<string, unknown>,
        logs: boolean,
    ): Promise<any> {
    // If input contains only a variable token, return the value of the variable while maintaining the variable type.
        const matchedTokens = input.match(this.VARIABLE_TOKEN)
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
        return input.replace(this.VARIABLE_TOKEN, (_match, variable) => {
            const result = this.evalInScope(variable, valuesMap)
            if (!isString(result)) {
                return JSON.stringify(result)
            }
            return result
        })
    }

    private async handleTypeAndResolving(
        path: string,
        censorConnections: boolean,
    ): Promise<any> {
    // Need to be resolved dynamically
        const connectionName = this.findConnectionName(path)
        if (isNil(connectionName)) {
            return ''
        }
        if (censorConnections) {
            return '**CENSORED**'
        }
        // Need to be resolved dynamically
        // Replace connection name with something that doesn't contain - or _, otherwise evalInScope would break
        const newPath = this.cleanPath(path, connectionName)
        const connection = await connectionService.obtain(connectionName)
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

    private evalInScope(js: string, contextAsScope: Record<string, unknown>): any {
        try {
            const keys = Object.keys(contextAsScope)
            const values = Object.values(contextAsScope)
            const functionBody = `return (${js})`
            const evaluatedFn = new Function(...keys, functionBody)
            const result = evaluatedFn(...values)
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

    private getExecutionStateObject(
        executionState: ExecutionState | null,
    ): Record<string, unknown> {
        if (isNil(executionState)) {
            return {}
        }
        const valuesMap: Record<string, unknown> = {}
        Object.entries(executionState.lastStepState).forEach(([key, value]) => {
            valuesMap[key] = value
        })
        return valuesMap
    }

    resolve<T = unknown>(params: ResolveParams): Promise<T> {
        const { unresolvedInput, executionState, logs } = params

        if (isNil(unresolvedInput)) {
            return Promise.resolve(unresolvedInput) as Promise<T>
        }

        return this.resolveInternally(
            JSON.parse(JSON.stringify(unresolvedInput)),
            this.getExecutionStateObject(executionState),
            logs,
        ) as Promise<T>
    }

    async applyProcessorsAndValidators(
        resolvedInput: Record<string, any>,
        props: NonAuthPiecePropertyMap,
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
                processedInput[key] = await handleAPFile(value.trim())
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

    extractConnectionNames(input: any): string[] {
        const connectionNames: string[] = []

        const extractFromValue = (value: any): void => {
            if (typeof value === 'string') {
                const matchedTokens = value.match(this.VARIABLE_TOKEN)
                if (
                    matchedTokens !== null &&
          matchedTokens.length === 1 &&
          matchedTokens[0] === value
                ) {
                    const variableName = value.substring(2, value.length - 2)
                    if (variableName.startsWith(VariableService.CONNECTIONS)) {
                        const connectionName = this.findConnectionName(variableName)
                        if (connectionName) {
                            connectionNames.push(connectionName)
                        }
                    }
                }
            }
            else if (Array.isArray(value)) {
                value.forEach(extractFromValue)
            }
            else if (typeof value === 'object' && value !== null) {
                for (const key in value) {
                    extractFromValue(value[key])
                }
            }
        }

        extractFromValue(input)
        return connectionNames
    }
}

type ResolveParams = {
    unresolvedInput: unknown
    executionState: ExecutionState | null
    logs: boolean
}
