import { isObject } from '@activepieces/shared'
import { ProcessorFn } from './types'

function getMaxArrayLength<T extends object>(props: T): number {
    return Math.max(
        ...Object.keys(props).map(key =>
            Array.isArray(props[key as keyof T]) ? (props[key as keyof T] as unknown as Array<unknown>).length : 1,
        ),
    )
}

function constructResultForIndex<T>(props: T, inputsName: (keyof T)[], index: number): T {
    const result = { ...props }
    inputsName.forEach(input => {
        const value = props[input];
        (result[input] as unknown) = Array.isArray(value) ? value[index] : value
    })
    return result
}

export const arrayZipperProcessor: ProcessorFn = (_property, value) => {
    if (Array.isArray(value)) {
        return value
    }
    if (!isObject(value)) {
        return value
    }
    const inputsName = Object.keys(value)
    const maxLength = getMaxArrayLength(value)
    return Array.from({ length: maxLength }, (_, index) =>
        constructResultForIndex(value, inputsName, index),
    )
}
