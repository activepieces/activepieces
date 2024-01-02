export function isString(str: unknown): str is string {
    return str != null && typeof str === 'string'
}

export function isNil<T>(value: T | null | undefined): value is null | undefined {
    return value === null || value === undefined
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
