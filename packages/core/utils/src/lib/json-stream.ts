function* jsonObject(entries: Iterable<[string, JsonFragment]>): Generator<string> {
    yield '{'
    let first = true
    for (const [key, value] of entries) {
        yield `${first ? '' : ','}${JSON.stringify(key)}:`
        first = false
        yield* toGenerator(value)
    }
    yield '}'
}

function* jsonArray(items: Iterable<JsonFragment>): Generator<string> {
    yield '['
    let first = true
    for (const item of items) {
        if (!first) {
            yield ','
        }
        first = false
        yield* toGenerator(item)
    }
    yield ']'
}

function definedEntries(record: Record<string, unknown>): Array<[string, string]> {
    return Object.entries(record)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]): [string, string] => [key, JSON.stringify(value)])
}

function* toGenerator(fragment: JsonFragment): Generator<string> {
    if (typeof fragment === 'string') {
        yield fragment
        return
    }
    yield* fragment
}

export const jsonStreamUtils = {
    jsonObject,
    jsonArray,
    definedEntries,
}

export type JsonFragment = string | Generator<string>
