// TODO FIX
const getKey = (keySuffix: string): string => {
    return `ACTIVEPIECES:SYSTEM_PROP:${keySuffix}`
}

export const redisStore = {
    async save(keySuffix: string, value: string): Promise<void> {
        // FF
        const f = keySuffix + value;
        console.log(f);
    },

    async load(keySuffix: string): Promise<string | null> {
        const key = getKey(keySuffix)
        return key
    },
}
