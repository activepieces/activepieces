import { isNil, isString } from './utils'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function deleteProperties(obj: Record<string, unknown>, props: string[]) {
    const copy = { ...obj }
    for (const prop of props) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete copy[prop]
    }
    return copy
}


export const spreadIfDefined = <T>(key: string, value: T | undefined | null): Record<string, T> => {
    if (isNil(value)) {
        return {}
    }
    return {
        [key]: value,
    }
}

export function deleteProps<T extends Record<string, unknown>, K extends keyof T>(
    obj: T,
    prop: K[],
): Omit<T, K> {
    const newObj = { ...obj }
    for (const p of prop) {
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete newObj[p]
    }
    return newObj
}

export function sanitizeObjectForPostgresql<T>(input: T): T {
    return applyFunctionToValuesSync<T>(input, (str) => {
        if (isString(str)) {
            // eslint-disable-next-line no-control-regex
            const controlCharsRegex = /\u0000/g
            return str.replace(controlCharsRegex, '')            
        }
        return str
    })
}

export function applyFunctionToValuesSync<T>(obj: unknown, apply: (str: string) => unknown): T {
    if (isNil(obj)) {
        return obj as T
    }
    else if (isString(obj)) {
        return apply(obj) as T
    }
    else if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; ++i) {
            obj[i] = applyFunctionToValuesSync(obj[i], apply)
        }
    }
    else if (isObject(obj)) {
        const entries = Object.entries(obj)
        for (const entry of entries) {
            const [key, value] = entry
            obj[key] = applyFunctionToValuesSync(value, apply)
        }
    }
    return obj as T
}


export async function applyFunctionToValues<T>(obj: unknown, apply: (str: string) => Promise<unknown>): Promise<T> {
    if (isNil(obj)) {
        return obj as T
    }
    else if (isString(obj)) {
        return await apply(obj) as T
    }
    else if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; ++i) {
            obj[i] = await applyFunctionToValues(obj[i], apply)
        }
    }
    else if (isObject(obj)) {
        const entries = Object.entries(obj)
        for (const entry of entries) {
            const [key, value] = entry
            obj[key] = await applyFunctionToValues(value, apply)
        }
    }
    return obj as T
}

export const isObject = (obj: unknown): obj is Record<string, unknown> => {
    return typeof obj === 'object' && obj !== null && !Array.isArray(obj)
}

export type MakeKeyNonNullableAndRequired<T extends object, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> }