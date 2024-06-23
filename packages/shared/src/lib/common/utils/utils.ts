export function isString(str: unknown): str is string {
    return str != null && typeof str === 'string'
}

export function isNil<T>(value: T | null | undefined): value is null | undefined {
    return value === null || value === undefined
}

export function kebabCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2') // Handle camelCase by adding hyphen between lowercase and uppercase letters
        .replace(/\s+/g, '-')                // Replace spaces with hyphens
        .replace(/_/g, '-')                  // Replace underscores with hyphens
        .toLowerCase()                       // Convert to lowercase
        .replace(/^-+|-+$/g, '')            // Remove leading and trailing hyphens
}


export function isEmpty<T>(value: T | null | undefined): boolean {
    if (value == null) {
        return true
    }

    if (typeof value === 'string' || Array.isArray(value)) {
        return value.length === 0
    }

    if (typeof value === 'object') {
        return Object.keys(value).length === 0
    }

    return false
}

type Dictionary<T> = {
    [key: string]: T
}

export function startCase(str: string): string {
    return str
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/^[a-z]/, match => match.toUpperCase())
        .replace(/\b[a-z]/g, match => match.toUpperCase())
}

export function camelCase(str: string): string {
    return str
        .replace(/([-_][a-z])/g, group => group.toUpperCase()
            .replace('-', '')
            .replace('_', ''))
}




export function pickBy<T extends Record<string, unknown>>(
    object: T,
    predicate: (value: T[keyof T], key: keyof T) => boolean,
): Partial<T> {
    return Object.keys(object).reduce((result: Partial<T>, key: keyof T) => {
        if (predicate(object[key], key)) {
            result[key] = object[key]
        }
        return result
    }, {})
}
