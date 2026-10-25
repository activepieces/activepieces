export const streamId = {
    parse(id: string): StreamId {
        const [ms, seq] = id.split('-')
        return { ms: Number(ms), seq: BigInt(seq ?? '0') }
    },
    format(id: StreamId): string {
        return `${id.ms}-${id.seq}`
    },
    increment(id: StreamId): StreamId {
        return id.seq === MAX_SEQUENCE ? { ms: id.ms + 1, seq: 0n } : { ms: id.ms, seq: id.seq + 1n }
    },
    compare(a: StreamId, b: StreamId): number {
        if (a.ms !== b.ms) {
            return a.ms < b.ms ? -1 : 1
        }
        return a.seq === b.seq ? 0 : a.seq < b.seq ? -1 : 1
    },
}

const MAX_SEQUENCE = 18446744073709551615n

export type StreamId = {
    ms: number
    seq: bigint
}
