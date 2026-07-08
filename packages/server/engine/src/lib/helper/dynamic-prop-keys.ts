import { isObject } from '@activepieces/core-utils'
import { InputPropertyMap } from '@activepieces/pieces-framework'

// react-hook-form treats `.` and `[` as path separators and strips `]`, `"` and `'`
// (see its stringToPath util), so dynamic-property keys containing any of these break
// the builder form. Escape them (JSON-Pointer style, `~` escapes the escape char) before
// keys reach the UI, and reverse the mapping before the piece consumes the values.
function escapePropsKeys(props: InputPropertyMap): InputPropertyMap {
    return Object.fromEntries(
        Object.entries(props).map(([key, property]) => [escapeKey(key), property]),
    )
}

function unescapePropsKeys(props: InputPropertyMap): InputPropertyMap {
    return Object.fromEntries(
        Object.entries(props).map(([key, property]) => [unescapeKey(key), property]),
    )
}

function unescapeInputKeys<T>(value: T): T {
    if (!isObject(value)) {
        return value
    }
    return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [unescapeKey(key), child]),
    ) as T
}

function escapeKey(key: string): string {
    return key.replace(/[~.[\]"']/g, (char) => ESCAPE_SEQUENCES[char])
}

function unescapeKey(key: string): string {
    return key.replace(/~[0-5]/g, (sequence) => UNESCAPE_SEQUENCES[sequence])
}

const ESCAPE_SEQUENCES: Record<string, string> = {
    '~': '~0',
    '.': '~1',
    '[': '~2',
    ']': '~3',
    '"': '~4',
    '\'': '~5',
}

const UNESCAPE_SEQUENCES: Record<string, string> = Object.fromEntries(
    Object.entries(ESCAPE_SEQUENCES).map(([char, sequence]) => [sequence, char]),
)

export const dynamicPropKeys = {
    escapePropsKeys,
    unescapePropsKeys,
    unescapeInputKeys,
}
