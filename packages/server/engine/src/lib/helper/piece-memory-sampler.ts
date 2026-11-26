import fs from 'node:fs'
import { Session } from 'node:inspector/promises'
import path from 'node:path'
import { isNil, tryCatch, tryCatchSync } from '@activepieces/core-utils'
import { EngineGenericError, SandboxPieceUsage } from '@activepieces/shared'

const SAMPLING_INTERVAL_BYTES = 32768

let session: Session | undefined
let trackedPieces: TrackedPiece[] = []
let latestUsage: SandboxPieceUsage[] = []

export const pieceMemorySampler = {
    start: async (): Promise<void> => {
        if (!isNil(session)) {
            return
        }
        const startingSession = new Session()
        startingSession.connect()
        const { error } = await tryCatch(() => startingSession.post('HeapProfiler.startSampling', { samplingInterval: SAMPLING_INTERVAL_BYTES }))
        if (error) {
            startingSession.disconnect()
            return
        }
        session = startingSession
    },

    trackPiece: ({ pieceName, pieceVersion, piecePath }: TrackPieceParams): void => {
        const entryDir = path.dirname(piecePath)
        const { data: realEntryDir } = tryCatchSync(() => fs.realpathSync(entryDir))
        const rootDir = `${realEntryDir ?? entryDir}${path.sep}`
        if (trackedPieces.some((piece) => piece.rootDir === rootDir)) {
            return
        }
        trackedPieces = [...trackedPieces, { pieceName, pieceVersion, rootDir }]
    },

    getUsage: async (): Promise<SandboxPieceUsage[]> => {
        if (isNil(session)) {
            return []
        }
        const { profile } = await session.post('HeapProfiler.getSamplingProfile')
        const bytesByRootDir = sumLiveBytesByRootDir({ node: profile.head, ownerRootDir: undefined, pieces: trackedPieces })
        return trackedPieces
            .map(({ pieceName, pieceVersion, rootDir }) => ({
                pieceName,
                pieceVersion,
                memoryUsageBytes: Math.round(bytesByRootDir.get(rootDir) ?? 0),
            }))
            .sort((a, b) => b.memoryUsageBytes - a.memoryUsageBytes)
    },

    refreshUsage: async (): Promise<void> => {
        if (isNil(session)) {
            throw new EngineGenericError('PieceMemorySamplerNotStartedError', 'Piece memory sampler is not started')
        }
        latestUsage = await pieceMemorySampler.getUsage()
    },

    getLatestUsage: (): SandboxPieceUsage[] => latestUsage,

    stop: (): void => {
        session?.disconnect()
        session = undefined
        trackedPieces = []
        latestUsage = []
    },
}

function sumLiveBytesByRootDir({ node, ownerRootDir, pieces }: SumLiveBytesParams): Map<string, number> {
    const rootDir = ownerRootDir ?? pieces.find((piece) => node.callFrame.url.includes(piece.rootDir))?.rootDir
    const childTotals = node.children.map((child) => sumLiveBytesByRootDir({ node: child, ownerRootDir: rootDir, pieces }))
    const ownTotals = isNil(rootDir) ? [] : [new Map([[rootDir, node.selfSize]])]
    return [...ownTotals, ...childTotals].reduce((merged, totals) => {
        for (const [key, bytes] of totals) {
            merged.set(key, (merged.get(key) ?? 0) + bytes)
        }
        return merged
    }, new Map<string, number>())
}

type TrackedPiece = {
    pieceName: string
    pieceVersion: string
    rootDir: string
}

type TrackPieceParams = {
    pieceName: string
    pieceVersion: string
    piecePath: string
}

type SamplingHeapProfileNode = {
    callFrame: { url: string }
    selfSize: number
    children: SamplingHeapProfileNode[]
}

type SumLiveBytesParams = {
    node: SamplingHeapProfileNode
    ownerRootDir: string | undefined
    pieces: TrackedPiece[]
}
