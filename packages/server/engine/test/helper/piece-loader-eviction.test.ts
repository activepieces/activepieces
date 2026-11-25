import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import v8 from 'node:v8'
import { afterEach, beforeAll, afterAll, describe, expect, it, vi } from 'vitest'
import { pieceLoader } from '../../src/lib/helper/piece-loader'

const PIECE_VERSION = '0.0.1'
let customPiecesPath: string

async function writeFakePiece(pieceName: string): Promise<void> {
    const packageName = pieceLoader.getPackageAlias({ pieceName, pieceVersion: PIECE_VERSION, devPieces: [] })
    const pieceFolder = path.join(customPiecesPath, 'pieces', packageName)
    await mkdir(path.join(pieceFolder, 'src'), { recursive: true })
    await writeFile(path.join(pieceFolder, 'package.json'), JSON.stringify({ name: pieceName, version: PIECE_VERSION }))
    await writeFile(path.join(pieceFolder, 'src', 'index.js'), 'class Piece {}\nmodule.exports = { piece: new Piece() }\n')
}

function loadPiece(pieceName: string) {
    return pieceLoader.loadPieceOrThrow({ pieceName, pieceVersion: PIECE_VERSION, devPieces: [] })
}

function stubHeapUsage({ used, limit }: { used: number, limit: number }): void {
    vi.spyOn(v8, 'getHeapStatistics').mockReturnValue({ ...v8.getHeapStatistics(), used_heap_size: used, heap_size_limit: limit })
}

describe('piece loader heap pressure eviction', () => {
    beforeAll(async () => {
        customPiecesPath = await mkdtemp(path.join(tmpdir(), 'piece-loader-eviction-'))
        await writeFakePiece('@activepieces/piece-eviction-a')
        await writeFakePiece('@activepieces/piece-eviction-b')
    })

    afterAll(async () => {
        await rm(customPiecesPath, { recursive: true, force: true })
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllEnvs()
    })

    it('keeps pieces cached below 80% heap usage in a reused sandbox', async () => {
        vi.stubEnv('AP_CUSTOM_PIECES_PATHS', customPiecesPath)
        vi.stubEnv('AP_SANDBOX_REUSABLE', 'true')
        stubHeapUsage({ used: 79, limit: 100 })

        const first = await loadPiece('@activepieces/piece-eviction-a')
        await loadPiece('@activepieces/piece-eviction-b')

        expect(await loadPiece('@activepieces/piece-eviction-a')).toBe(first)
    })

    it('evicts every loaded piece at 80% heap usage in a reused sandbox', async () => {
        vi.stubEnv('AP_CUSTOM_PIECES_PATHS', customPiecesPath)
        vi.stubEnv('AP_SANDBOX_REUSABLE', 'true')
        stubHeapUsage({ used: 10, limit: 100 })
        const first = await loadPiece('@activepieces/piece-eviction-a')

        stubHeapUsage({ used: 80, limit: 100 })
        await loadPiece('@activepieces/piece-eviction-b')
        stubHeapUsage({ used: 10, limit: 100 })

        expect(await loadPiece('@activepieces/piece-eviction-a')).not.toBe(first)
    })

    it('never evicts when the sandbox is not reused', async () => {
        vi.stubEnv('AP_CUSTOM_PIECES_PATHS', customPiecesPath)
        vi.stubEnv('AP_SANDBOX_REUSABLE', 'false')
        stubHeapUsage({ used: 99, limit: 100 })

        const first = await loadPiece('@activepieces/piece-eviction-a')
        await loadPiece('@activepieces/piece-eviction-b')

        expect(await loadPiece('@activepieces/piece-eviction-a')).toBe(first)
    })
})
