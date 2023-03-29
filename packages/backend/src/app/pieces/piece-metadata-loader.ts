import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import axios from 'axios';
import sortBy from 'lodash/sortBy';
import { Piece } from '@activepieces/framework';
import { ActivepiecesError, ApEnvironment, ErrorCode, PieceMetadata, PieceMetadataSummary } from '@activepieces/shared';
import { system } from '../helper/system/system';
import { SystemProp } from '../helper/system/system-prop';
import { captureException, logger } from '../helper/logger';

type PieceMetadataLoader = {
    /**
     * returns a list of all available pieces and their metadata without actions and triggers.
     */
    manifest(): Promise<PieceMetadataSummary[]>;

    /**
     * returns metadata for a specific piece version including actions and triggers.
     */
    pieceMetadata(name: string, version: string): Promise<PieceMetadata>;
}

/**
 * Loads piece metadata from CDN.
 * Used in production.
 */
const cdnPieceMetadataLoader = (): PieceMetadataLoader => {
    const CDN = 'https://activepieces-cdn.fra1.digitaloceanspaces.com/pieces/metadata';

    return {
        async manifest() {
            const response = await axios<PieceMetadataSummary[]>(`${CDN}/latest.json`);
            return response.data;
        },

        async pieceMetadata(pieceName: string, version: string) {
            try {
                const response = await axios<PieceMetadata>(`${CDN}/${pieceName}/${version}.json`);
                return response.data;
            }
            catch (e) {
                logger.error(e, 'cdnPieceMetadataLoader.pieceMetadata');
                throw new ActivepiecesError({
                    code: ErrorCode.PIECE_NOT_FOUND,
                    params: {
                        pieceName,
                        pieceVersion: version,
                    },
                });
            }
        }
    }
}

/**
 * Loads piece metadata from the file system.
 * Used in development.
 */
const filePieceMetadataLoader = (): PieceMetadataLoader => {
    const loadPiecesMetadata = async (): Promise<PieceMetadata[]> => {
        const frameworkPackages = ['framework', 'apps', 'dist']
        const piecesPath = resolve(cwd(), 'packages', 'pieces')
        const piecePackages = await readdir(piecesPath)
        const filteredPiecePackages = piecePackages.filter(d => !frameworkPackages.includes(d))

        const piecesMetadata: PieceMetadata[] = [];

        for (const piecePackage of filteredPiecePackages) {
            try {
                const module = await import(`../../../../pieces/${piecePackage}/src/index.ts`)
                const piece = Object.values<Piece>(module)[0]
                piecesMetadata.push(piece.metadata())
            }
            catch(ex) {
                captureException(ex);
                logger.error(ex);
            }
        }

        return sortBy(piecesMetadata, [p => p.displayName.toUpperCase()])
    }

    return {
        async manifest() {
            const piecesMetadata = await loadPiecesMetadata();

            return piecesMetadata.map(p => ({
                name: p.name,
                displayName: p.displayName,
                description: p.description,
                logoUrl: p.logoUrl,
                version: p.version,
                minimumSupportedRelease: p.minimumSupportedRelease,
                maximumSupportedRelease: p.maximumSupportedRelease,
                actions: Object.keys(p.actions).length,
                triggers: Object.keys(p.triggers).length,
            }))
        },

        async pieceMetadata(pieceName: string) {
            const piecesMetadata = await loadPiecesMetadata();
            const pieceMetadata = piecesMetadata.find(p => p.name === pieceName);

            if (pieceMetadata === undefined) {
                throw new ActivepiecesError({
                    code: ErrorCode.PIECE_NOT_FOUND,
                    params: {
                        pieceName,
                        pieceVersion: pieceMetadata.version,
                    },
                });
            }

            return pieceMetadata;
        }
    }
};

const getPieceMetadataLoader = (): PieceMetadataLoader => {
    const env = system.getOrThrow(SystemProp.ENVIRONMENT);

    if (env === ApEnvironment.PRODUCTION) {
        return cdnPieceMetadataLoader();
    }

    return filePieceMetadataLoader();
}

export const pieceMetadataLoader = getPieceMetadataLoader();
