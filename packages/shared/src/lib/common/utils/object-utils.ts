import { isNil, isString } from "./utils"


export const spreadIfDefined = <T>(key: string, value: T | undefined | null) => {
    if (isNil(value)) {
        return {}
    }
    return {
        [key]: value
    }
}

export function applyFunctionToValuesSync(obj: any, apply: (str: any) => any) {
    if (isNil(obj)) {
        return obj;
    } else if (isString(obj)) {
        return apply(obj);
    } else if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; ++i) {
            obj[i] = applyFunctionToValuesSync(obj[i], apply);
        }
    } else if (typeof obj === 'object') {
        const entries = Object.entries(obj);
        for (let i = 0; i < entries.length; ++i) {
            const [key, value] = entries[i];
            obj[key] = applyFunctionToValuesSync(value, apply);
        }
    }
    return apply(obj);
}


export async function applyFunctionToValues(obj: any, apply: (str: any) => Promise<any>) {
    if (isNil(obj)) {
        return obj;
    } else if (isString(obj)) {
        return await apply(obj);
    } else if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; ++i) {
            obj[i] = await applyFunctionToValues(obj[i], apply);
        }
    } else if (typeof obj === 'object') {
        const entries = Object.entries(obj);
        for (let i = 0; i < entries.length; ++i) {
            const [key, value] = entries[i];
            obj[key] = await applyFunctionToValues(value, apply);
        }
    }
    return await apply(obj);
}

