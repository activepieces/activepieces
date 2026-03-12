import { Property } from "@activepieces/pieces-framework"
import { isNil } from "@activepieces/shared"

type ErrorInfo = {
    value: unknown | null,
    location: number
}

type Response = {
    hasError: true,
    error: {
        message: string,
        errors: ErrorInfo[]
    }
} | {
    hasError: false,
    values: number[]
}

export const common = {
    note: Property.MarkDown({
        value: "If you'd like to use the values with a previous step, click the (X) first, and then select the step you want to use.",
    }),
    validateArray: function (values: unknown[]): Response {
        const newValues = values.map((value, index) => checkValueIsNumber(value, index))
        const isAllNumbers = newValues.every((value) => value.error === null)
        if(isAllNumbers) {
            return {
                hasError: false,
                values: newValues.map((value) => value.value as number),
            }
        }
        return {
            hasError: true,
            error: {
                message: 'The following values are not numbers',
                errors: newValues.filter((value) => !isNil(value)).map((value) => value.error as ErrorInfo)
            }
        }
    }
}

type ValueInfo = {
    error: ErrorInfo | null,
    value: number | null
}

export const checkValueIsNumber = function (value: unknown, location: number): ValueInfo {
    const parsedValue = Number(value);
    if (!Number.isNaN(parsedValue)) {
        return {
            error: null,
            value: Number(value)
        }
    }
    return {
        error: {
            value: value,
            location: location
        },
        value: -1
    }
}