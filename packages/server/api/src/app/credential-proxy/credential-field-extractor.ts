import { isNil } from '@activepieces/core-utils'
import { PieceMetadataModel, PropertyType } from '@activepieces/pieces-framework'
import { AppConnectionType, AppConnectionValue, CredentialGrantField, credentialPlaceholder } from '@activepieces/shared'
import { allowedHostsResolver } from './allowed-hosts-resolver'

export const credentialFieldExtractor = {
    extract({ value, pieceAuth }: ExtractParams): CredentialGrantField[] {
        return secretPaths({ value, pieceAuth }).map((path, index) => ({ index, path }))
    },
    applyPlaceholders<T extends Record<string, unknown>>({ value, grantId, fields }: ApplyPlaceholdersParams<T>): T {
        return fields.reduce((current, field) => {
            const replacement = credentialPlaceholder.build({ grantId, fieldIndex: field.index })
            const copies = duplicatePathsOf({ value: current, path: field.path })
            return [field.path, ...copies].reduce((target, path) => replaceAtPath({ target, path, replacement }), current)
        }, value)
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
                ...nestedKeyPaths({ value: value.data, key: 'access_token', prefix: ['data'] }).filter((path) => path.length > OAUTH2_ACCESS_TOKEN_COPY.length),
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
            return [['refresh_token'], ...nestedKeyPaths({ value: value.data, key: 'refresh_token', prefix: ['data'] })]
        case AppConnectionType.SECRET_TEXT:
        case AppConnectionType.BASIC_AUTH:
        case AppConnectionType.CUSTOM_AUTH:
        case AppConnectionType.OIDC:
        case AppConnectionType.NO_AUTH:
            return []
    }
}

function duplicatePathsOf({ value, path }: { value: Record<string, unknown>, path: string[] }): string[][] {
    const isOAuth2AccessToken = path.length === 1 && path[0] === 'access_token' && OAUTH2_TYPES.includes(String(value['type']))
    if (!isOAuth2AccessToken) {
        return []
    }
    const copy = credentialFieldExtractor.readAtPath({ value, path: OAUTH2_ACCESS_TOKEN_COPY })
    return isNil(copy) ? [] : [OAUTH2_ACCESS_TOKEN_COPY]
}

function nestedKeyPaths({ value, key, prefix }: { value: Record<string, unknown>, key: string, prefix: string[] }): string[][] {
    return Object.entries(value).flatMap(([childKey, child]) => {
        const path = [...prefix, childKey]
        if (isRecord(child)) {
            return nestedKeyPaths({ value: child, key, prefix: path })
        }
        return childKey === key && typeof child === 'string' && child.length > 0 ? [path] : []
    })
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
    if (declaredType === PropertyType.SECRET_TEXT) {
        return true
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
const OAUTH2_ACCESS_TOKEN_COPY = ['data', 'access_token']
const OAUTH2_TYPES: string[] = [AppConnectionType.OAUTH2, AppConnectionType.CLOUD_OAUTH2, AppConnectionType.PLATFORM_OAUTH2]

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
