import { isNil, SeekPage } from '@activepieces/core-utils'
import { CursorResult } from './paginator'

export function atob(value: string): string {
    return Buffer.from(value, 'base64').toString()
}

export function btoa(value: string): string {
    return Buffer.from(value).toString('base64')
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
    if (isNil(cursor)) {
        return null
    }
    return encode('next_' + cursor)
}

function encodePreviousCursor(cursor: string | null | undefined) {
    if (isNil(cursor)) {
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
    decodeCursor(encodedCursor: string | null | undefined): {
        nextCursor: string | undefined
        previousCursor: string | undefined
    } {
        if (isNil(encodedCursor)) {
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
