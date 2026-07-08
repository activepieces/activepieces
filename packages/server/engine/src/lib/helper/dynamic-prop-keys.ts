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

// Escaped keys carry the ESCAPED_KEY_MARKER prefix so unescaping only ever touches keys
// this module produced: a literal key like `field~1name` that never went through
// escapeKey (schema-less tool calls, API-created flows) passes through unchanged.
// The mapping stays bijective because unescaped keys can never contain `~` (any `~`
// triggers escaping), so they can never start with the marker.
function escapeKey(key: string): string {
    if (!RESERVED_CHARS.test(key)) {
        return key
    }
    return ESCAPED_KEY_MARKER + key.replace(/[~.[\]"']/g, (char) => ESCAPE_SEQUENCES[char])
}

function unescapeKey(key: string): string {
    if (!key.startsWith(ESCAPED_KEY_MARKER)) {
        return key
    }
    return key.slice(ESCAPED_KEY_MARKER.length).replace(/~[0-5]/g, (sequence) => UNESCAPE_SEQUENCES[sequence])
}

const ESCAPED_KEY_MARKER = '~ap~'

const RESERVED_CHARS = /[~.[\]"']/

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
