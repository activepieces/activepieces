import { isNil } from '@activepieces/core-utils'
import { PieceMetadataModel, PropertyType } from '@activepieces/pieces-framework'
import { AppConnectionType, AppConnectionValue, CredentialGrantField, credentialPlaceholder } from '@activepieces/shared'
import { allowedHostsResolver } from './allowed-hosts-resolver'

export const credentialFieldExtractor = {
    extract({ value, pieceAuth }: ExtractParams): CredentialGrantField[] {
        return secretPaths({ value, pieceAuth }).map((path, index) => ({ index, path }))
    },
    applyPlaceholders<T extends Record<string, unknown>>({ value, grantId, fields }: ApplyPlaceholdersParams<T>): T {
        return fields.reduce((current, field) => replaceAtPath({
            target: current,
            path: field.path,
            replacement: credentialPlaceholder.build({ grantId, fieldIndex: field.index }),
        }), value)
    },
    redactUnresolvable(value: AppConnectionValue): AppConnectionValue {
        return unresolvablePaths(value)
            .filter((path) => !isNil(credentialFieldExtractor.readAtPath({ value, path })))
            .reduce((current, path) => replaceAtPath({ target: current, path, replacement: REDACTED }), value)
    },
    readAtPath({ value, path }: ReadAtPathParams): string | null {
        const [head, ...rest] = path
        if (isNil(head)) {
            return null
        }
        const child = value[head]
        if (rest.length === 0) {
            return typeof child === 'string' ? child : null
        }
        return isRecord(child) ? credentialFieldExtractor.readAtPath({ value: child, path: rest }) : null
    },
}

function secretPaths({ value, pieceAuth }: ExtractParams): string[][] {
    switch (value.type) {
        case AppConnectionType.SECRET_TEXT:
            return [['secret_text']]
        case AppConnectionType.BASIC_AUTH:
            return [['password']]
        case AppConnectionType.OAUTH2:
        case AppConnectionType.CLOUD_OAUTH2:
        case AppConnectionType.PLATFORM_OAUTH2:
            return [
                ['access_token'],
                ...(typeof value.data['access_token'] === 'string' ? [['data', 'access_token']] : []),
            ]
        case AppConnectionType.CUSTOM_AUTH:
            return [
                ...secretPropPaths({ props: value.props, pieceAuth }),
                ...(typeof value.access_token === 'string' ? [['access_token']] : []),
            ]
        case AppConnectionType.OIDC:
            return secretPropPaths({ props: value.props, pieceAuth })
        case AppConnectionType.NO_AUTH:
            return []
    }
}

function unresolvablePaths(value: AppConnectionValue): string[][] {
    switch (value.type) {
        case AppConnectionType.OAUTH2:
        case AppConnectionType.CLOUD_OAUTH2:
        case AppConnectionType.PLATFORM_OAUTH2:
            return [['refresh_token'], ['data', 'refresh_token'], ['data', 'id_token']]
        case AppConnectionType.SECRET_TEXT:
        case AppConnectionType.BASIC_AUTH:
        case AppConnectionType.CUSTOM_AUTH:
        case AppConnectionType.OIDC:
        case AppConnectionType.NO_AUTH:
            return []
    }
}

function secretPropPaths({ props, pieceAuth }: { props: Record<string, unknown>, pieceAuth: PieceMetadataModel['auth'] }): string[][] {
    const declared = declaredPropTypes(pieceAuth)
    return Object.entries(props)
        .filter(([key, propValue]) => isSecretProp({ key, propValue, declaredType: declared.get(key) }))
        .map(([key]) => ['props', key])
}

function isSecretProp({ key, propValue, declaredType }: { key: string, propValue: unknown, declaredType: PropertyType | undefined }): boolean {
    if (typeof propValue !== 'string' || propValue.length === 0) {
        return false
    }
    if (!isNil(declaredType)) {
        return declaredType === PropertyType.SECRET_TEXT
    }
    return SECRET_NAME_PATTERN.test(key) && allowedHostsResolver.hostnameOf(propValue) === null
}

function declaredPropTypes(pieceAuth: PieceMetadataModel['auth']): Map<string, PropertyType> {
    const auths = isNil(pieceAuth) ? [] : Array.isArray(pieceAuth) ? pieceAuth : [pieceAuth]
    const entries = auths.flatMap((auth) => {
        if (auth.type !== PropertyType.CUSTOM_AUTH && auth.type !== PropertyType.OIDC) {
            return []
        }
        return Object.entries(auth.props).flatMap(([key, prop]): [string, PropertyType][] => {
            const type = isRecord(prop) ? prop['type'] : undefined
            return isPropertyType(type) ? [[key, type]] : []
        })
    })
    return new Map(entries)
}

function isPropertyType(value: unknown): value is PropertyType {
    return typeof value === 'string' && Object.values<string>(PropertyType).includes(value)
}

function replaceAtPath<T extends Record<string, unknown>>({ target, path, replacement }: { target: T, path: string[], replacement: string }): T {
    const [head, ...rest] = path
    if (isNil(head)) {
        return target
    }
    if (rest.length === 0) {
        return { ...target, [head]: replacement }
    }
    const child = target[head]
    if (!isRecord(child)) {
        return target
    }
    return { ...target, [head]: replaceAtPath({ target: child, path: rest, replacement }) }
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const SECRET_NAME_PATTERN = /(key|secret|token|password|passwd|pwd)/i
const REDACTED = '(REDACTED)'

type ExtractParams = {
    value: AppConnectionValue
    pieceAuth: PieceMetadataModel['auth']
}

type ApplyPlaceholdersParams<T extends Record<string, unknown>> = {
    value: T
    grantId: string
    fields: CredentialGrantField[]
}

type ReadAtPathParams = {
    value: Record<string, unknown>
    path: string[]
}
