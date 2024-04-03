import dayjs from 'dayjs'
import { CursorResult } from './paginator'
import { SeekPage } from '@activepieces/shared'

export function atob(value: string): string {
    return Buffer.from(value, 'base64').toString()
}

export function btoa(value: string): string {
    return Buffer.from(value).toString('base64')
}

export function encodeByType(type: string, value: unknown): string | null {
    if (value === null) return null

    switch (type) {
        case 'timestamp with time zone':
        case 'datetime':
        case 'date': {
            return dayjs(value as string)
                .valueOf()
                .toString()
        }
        case 'number': {
            return `${value}`
        }
        case 'string': {
            return encodeURIComponent(value as string)
        }
        case 'object': {
            /**
       * if reflection type is Object, check whether an object is a date.
       * see: https://github.com/rbuckton/reflect-metadata/issues/84
       */
            if (typeof (value as Record<string, unknown>).getTime === 'function') {
                return (value as Date).getTime().toString()
            }

            break
        }
        default:
            break
    }

    throw new Error(`unknown type in cursor: [${type}]${value}`)
}

export function decodeByType(
    type: string,
    value: string,
): string | number | Date {
    switch (type) {
        case 'object':
        case 'timestamp with time zone':
        case 'datetime':
        case 'date': {
            const timestamp = parseInt(value, 10)
            if (Number.isNaN(timestamp)) {
                throw new Error('date column in cursor should be a valid timestamp')
            }
            return new Date(timestamp).toISOString()
        }

        case 'number': {
            const num = parseFloat(value)

            if (Number.isNaN(num)) {
                throw new Error('number column in cursor should be a valid number')
            }

            return num
        }

        case 'string': {
            return decodeURIComponent(value)
        }

        default: {
            throw new Error(`unknown type in cursor: [${type}]${value}`)
        }
    }
}

const decode = (str: string): string =>
    Buffer.from(str, 'base64').toString('binary')
const encode = (str: string): string =>
    Buffer.from(str, 'binary').toString('base64')

function encodeNextCursor(cursor: string | null | undefined) {
    if (cursor === null) {
        return null
    }
    return encode('next_' + cursor)
}

function encodePreviousCursor(cursor: string | null | undefined) {
    if (cursor === null) {
        return null
    }
    return encode('prev_' + cursor)
}

export const paginationHelper = {
    createPage<T>(data: T[], cursor: CursorResult | null): SeekPage<T> {
        return {
            next: encodeNextCursor(cursor?.afterCursor),
            previous: encodePreviousCursor(cursor?.beforeCursor),
            data,
        }
    },
    decodeCursor(encodedCursor: string | null): {
        nextCursor: string | undefined
        previousCursor: string | undefined
    } {
        if (encodedCursor === null || encodedCursor === undefined) {
            return {
                nextCursor: undefined,
                previousCursor: undefined,
            }
        }
        const decodedRawCursor = decode(encodedCursor)
        const isNext = decodedRawCursor.startsWith('next_')
        const cursor = decodedRawCursor.split('_')[1]
        return {
            nextCursor: isNext ? cursor : undefined,
            previousCursor: isNext ? undefined : cursor,
        }
    },
}
