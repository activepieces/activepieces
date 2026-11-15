import * as semver from 'semver'
import type { PieceMetadata } from '../../../packages/pieces/framework/src'

export const pieceReleaseCompat = { findUnsupportedReason, partitionByServability }

function findUnsupportedReason({ pieceMetadata, currentRelease }: { pieceMetadata: PieceMetadata, currentRelease: string }): string | null {
    const { minimumSupportedRelease, maximumSupportedRelease } = pieceMetadata

    if (!semver.valid(currentRelease)) {
        return null
    }

    if (maximumSupportedRelease && semver.valid(maximumSupportedRelease) && semver.gt(currentRelease, maximumSupportedRelease)) {
        return `maximumSupportedRelease ${maximumSupportedRelease} is below it`
    }

    if (minimumSupportedRelease && semver.valid(minimumSupportedRelease) && semver.gt(minimumSupportedRelease, currentRelease)) {
        return `minimumSupportedRelease ${minimumSupportedRelease} is above it`
    }

    return null
}

function partitionByServability({ piecesMetadata, currentRelease }: { piecesMetadata: PieceMetadata[], currentRelease: string }): ServabilityPartition {
    const evaluated = piecesMetadata.map((pieceMetadata) => ({
        pieceMetadata,
        reason: findUnsupportedReason({ pieceMetadata, currentRelease }),
    }))

    return {
        servable: evaluated
            .filter((entry) => entry.reason === null)
            .map((entry) => entry.pieceMetadata),
        unservable: evaluated
            .filter((entry) => entry.reason !== null)
            .map((entry) => `${entry.pieceMetadata.name}@${entry.pieceMetadata.version}: ${entry.reason}`),
    }
}

type ServabilityPartition = {
    servable: PieceMetadata[]
    unservable: string[]
}
