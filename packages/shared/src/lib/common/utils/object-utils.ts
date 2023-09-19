import { isNil, isString } from "./utils"


export const spreadIfDefined = <T>(key: string, value: T | undefined | null) => {
    if (isNil(value)) {
        return {}
    }
    return {
        [key]: value
    }
}


export async function applyFunctionToValues(obj: any, trim: (str: any) => Promise<any>) {
    if (isNil(obj)) {
        return obj;
    } else if (isString(obj)) {
        return await trim(obj);
    } else if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; ++i) {
            obj[i] = await applyFunctionToValues(obj[i], trim);
        }
    } else if (typeof obj === 'object') {
        const entries = Object.entries(obj);
        for (let i = 0; i < entries.length; ++i) {
            const [key, value] = entries[i];
            obj[key] = await applyFunctionToValues(value, trim);
        }
    }
    return await trim(obj);
}

