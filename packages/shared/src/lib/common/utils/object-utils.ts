import { isNil } from "./utils"


export const spreadIfDefined = <T>(key: string, value: T | undefined | null) => {
    if (isNil(value)) {
        return {}
    }

    return {
        [key]: value
    }
}
