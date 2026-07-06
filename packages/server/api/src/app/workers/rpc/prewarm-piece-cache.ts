import { redisConnections } from '../../database/redis'

// Append-only list of the pieces a platform's flows have used. It is never trimmed or expired: adding
// a piece to a flow pushes it here (see the flow-version side effects), and a piece staying installed
// after it stops being used is harmless. getPrewarmData seeds the list from the existing flows on the
// first read (when the list is still empty).
export const prewarmPieceCache = {
    async get(platformId: string): Promise<PieceRef[]> {
        const redis = await redisConnections.useExisting()
        const raw = await redis.lrange(cacheKey(platformId), 0, -1)
        return dedupe(raw.map((item) => JSON.parse(item) as PieceRef))
    },
    async append(platformId: string, pieces: PieceRef[]): Promise<void> {
        if (pieces.length === 0) {
            return
        }
        const redis = await redisConnections.useExisting()
        const key = cacheKey(platformId)
        const existing = new Set((await redis.lrange(key, 0, -1)).map((item) => refKey(JSON.parse(item) as PieceRef)))
        const toAdd = pieces.filter((piece) => !existing.has(refKey(piece)))
        if (toAdd.length === 0) {
            return
        }
        await redis.rpush(key, ...toAdd.map((piece) => JSON.stringify(piece)))
    },
}

function cacheKey(platformId: string): string {
    return `prewarm:used-pieces:${platformId}`
}

function refKey(piece: PieceRef): string {
    return `${piece.pieceName}@${piece.pieceVersion}`
}

function dedupe(pieces: PieceRef[]): PieceRef[] {
    return [...new Map(pieces.map((piece) => [refKey(piece), piece])).values()]
}

export type PieceRef = {
    pieceName: string
    pieceVersion: string
}
