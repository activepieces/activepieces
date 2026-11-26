import { mkdtempSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pieceMemorySampler } from '../../src/lib/helper/piece-memory-sampler'

const MB = 1024 * 1024
const HOLDING_PIECE_SOURCE = `
let held = []
exports.hold = (mb) => {
    for (let i = 0; i < mb * 1024; i++) {
        held.push({ value: ('x'.repeat(500) + i + '!'.repeat(500)).slice(1) + 'y' })
    }
}
exports.release = () => {
    held = []
}
`

function writePiece({ source }: { source: string }): string {
    const piecePath = join(mkdtempSync(join(tmpdir(), 'piece-memory-sampler-')), 'index.js')
    writeFileSync(piecePath, source)
    return piecePath
}

describe('pieceMemorySampler', () => {
    afterEach(() => {
        pieceMemorySampler.stop()
    })

    it('returns nothing when sampling was never started', async () => {
        expect(await pieceMemorySampler.getUsage()).toEqual([])
    })

    it('rejects a refresh when sampling was never started so the caller can fall back to gc', async () => {
        await expect(pieceMemorySampler.refreshUsage()).rejects.toThrow()
    })

    it('serves the last refreshed usage without reading the profile again', async () => {
        await pieceMemorySampler.start()
        const piecePath = writePiece({ source: 'exports.noop = () => undefined' })
        pieceMemorySampler.trackPiece({ pieceName: '@activepieces/piece-idle', pieceVersion: '0.2.0', piecePath })

        expect(pieceMemorySampler.getLatestUsage()).toEqual([])
        await pieceMemorySampler.refreshUsage()

        expect(pieceMemorySampler.getLatestUsage().map(({ pieceName }) => pieceName)).toEqual(['@activepieces/piece-idle'])
    })

    it('attributes live heap to the piece that allocated it', async () => {
        await pieceMemorySampler.start()
        const holdingPiecePath = writePiece({ source: HOLDING_PIECE_SOURCE })
        const idlePiecePath = writePiece({ source: 'exports.noop = () => undefined' })
        pieceMemorySampler.trackPiece({ pieceName: '@activepieces/piece-holding', pieceVersion: '0.1.0', piecePath: holdingPiecePath })
        pieceMemorySampler.trackPiece({ pieceName: '@activepieces/piece-idle', pieceVersion: '0.2.0', piecePath: idlePiecePath })
        pieceMemorySampler.trackPiece({ pieceName: '@activepieces/piece-idle', pieceVersion: '0.2.0', piecePath: idlePiecePath })
        const require = createRequire(__filename)
        require(idlePiecePath)
        require(holdingPiecePath).hold(20)

        const usage = await pieceMemorySampler.getUsage()

        expect(usage.map(({ pieceName, pieceVersion }) => `${pieceName}@${pieceVersion}`)).toEqual([
            '@activepieces/piece-holding@0.1.0',
            '@activepieces/piece-idle@0.2.0',
        ])
        expect(usage[0].memoryUsageBytes).toBeGreaterThan(10 * MB)
        expect(usage[0].memoryUsageBytes).toBeLessThan(40 * MB)
        expect(usage[1].memoryUsageBytes).toBeLessThan(MB)
    })

    it('stops counting memory once the piece releases it', async () => {
        await pieceMemorySampler.start()
        const releasingPiecePath = writePiece({ source: HOLDING_PIECE_SOURCE })
        const keepingPiecePath = writePiece({ source: HOLDING_PIECE_SOURCE })
        pieceMemorySampler.trackPiece({ pieceName: '@activepieces/piece-releasing', pieceVersion: '0.1.0', piecePath: releasingPiecePath })
        pieceMemorySampler.trackPiece({ pieceName: '@activepieces/piece-keeping', pieceVersion: '0.1.0', piecePath: keepingPiecePath })
        const require = createRequire(__filename)
        const releasingPiece = require(releasingPiecePath)
        releasingPiece.hold(20)
        require(keepingPiecePath).hold(20)
        const bytesOf = async (pieceName: string): Promise<number> => {
            const usage = await pieceMemorySampler.getUsage()
            return usage.find((piece) => piece.pieceName === pieceName)?.memoryUsageBytes ?? 0
        }
        const heldBytes = await bytesOf('@activepieces/piece-releasing')

        releasingPiece.release()

        expect(heldBytes).toBeGreaterThan(10 * MB)
        expect(await bytesOf('@activepieces/piece-releasing')).toBeLessThan(heldBytes / 4)
        expect(await bytesOf('@activepieces/piece-keeping')).toBeGreaterThan(10 * MB)
    })
})
