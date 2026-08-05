import { isNil, SeekPage } from '@activepieces/core-utils'
import { CursorResult } from './paginator'

export function atob(value: string): string {
    return Buffer.from(value, 'base64').toString()
}

export function btoa(value: string): string {
    return Buffer.from(value).toString('base64')
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
