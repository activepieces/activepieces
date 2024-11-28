import deepmerge from 'deepmerge'

export function isString(str: unknown): str is string {
    return str != null && typeof str === 'string'
}

export function isNil<T>(value: T | null | undefined): value is null | undefined {
    return value === null || value === undefined
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setAtPath<T, K extends keyof any>(obj: T, path: K | K[], value: any): void {
    const pathArray = Array.isArray(path) ? path : (path as string).match(/([^[.\]])+/g) as unknown as K[]

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pathArray.reduce((acc: any, key: K, i: number) => {
        if (acc[key] === undefined) acc[key] = {}
        if (i === pathArray.length - 1) acc[key] = value
        return acc[key]
    }, obj)
}


export function insertAt<T>(array: T[], index: number, item: T): T[] {
    return [...array.slice(0, index), item, ...array.slice(index)]
}

export function debounce<T>(func: (...args: T[]) => void, wait: number): (...args: T[]) => void {
    let timeout: NodeJS.Timeout

    return function (...args: T[]) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }

        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}


type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends Record<string, unknown> ? DeepPartial<T[P]> : T[P];
}

export function deepMergeAndCast<T>(target: DeepPartial<T>, source: DeepPartial<T>): T {
    return deepmerge(target as Partial<T>, source as Partial<T>) as T
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

export function parseToJsonIfPossible(str: unknown): unknown {
    try {
        return JSON.parse(str as string)
    }
    catch (e) {
        return str
    }
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
