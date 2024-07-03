export type ErrorInfo = {
    error: string,
    value: any,
    location: number
}

export type ValueInfo = {
    isNumber: boolean,
    info: ErrorInfo|null,
    value: number
}

export const checkValueIsNumber = function (value: any, location: number): ValueInfo {
    if (typeof value === 'string' && !Number.isNaN(parseInt(value))) {
        value = parseInt(value);
      }
    if (typeof value !== 'number') {
        return {
            isNumber: false,
            info:  {
                error: `The following value: ${value} in the array is not a number`,
                value: value,
                location: location
            },
            value: -1
        }
    }
    return {
        isNumber: true,
        info: null,
        value: value as number
    }
}