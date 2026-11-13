function read({ source, key }: { source: unknown, key: string }): unknown {
    if (source === null || typeof source !== 'object') {
        return undefined
    }
    return Object.getOwnPropertyDescriptor(source, key)?.value
}

export const ownValue = {
    read,
}
