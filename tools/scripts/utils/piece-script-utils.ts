
import { existsSync } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { resolve, join, relative } from 'node:path'
import { cwd } from 'node:process'
import { extractPieceFromModule } from '@activepieces/shared'
import * as semver from 'semver'
import { readPackageJson } from './files'
import { StatusCodes } from 'http-status-codes'
import { pieceTranslation,PieceMetadata } from '@activepieces/pieces-framework'
type SubPiece = {
    name: string;
    displayName: string;
    version: string;
    minimumSupportedRelease?: string;
    maximumSupportedRelease?: string;
    metadata(): Omit<PieceMetadata, 'name' | 'version'>;
};

export const AP_CLOUD_API_BASE = 'https://cloud.activepieces.com/api/v1';
export const PIECES_FOLDER = 'packages/pieces'
export const COMMUNITY_PIECE_FOLDER = 'packages/pieces/community'
export const NON_PIECES_PACKAGES = ['@activepieces/pieces-framework', '@activepieces/pieces-common']

const validateSupportedRelease = (minRelease: string | undefined, maxRelease: string | undefined) => {
    if (minRelease !== undefined && !semver.valid(minRelease)) {
        throw Error(`[validateSupportedRelease] "minimumSupportedRelease" should be a valid semver version`)
    }

    if (maxRelease !== undefined && !semver.valid(maxRelease)) {
        throw Error(`[validateSupportedRelease] "maximumSupportedRelease" should be a valid semver version`)
    }

    if (minRelease !== undefined && maxRelease !== undefined && semver.gt(minRelease, maxRelease)) {
        throw Error(`[validateSupportedRelease] "minimumSupportedRelease" should be less than "maximumSupportedRelease"`)
    }
}

const validateMetadata = (pieceMetadata: PieceMetadata): void => {
    console.info(`[validateMetadata] pieceName=${pieceMetadata.name}`)
    validateSupportedRelease(
        pieceMetadata.minimumSupportedRelease,
        pieceMetadata.maximumSupportedRelease,
    )
}


const byDisplayNameIgnoreCase = (a: PieceMetadata, b: PieceMetadata) => {
    const aName = a.displayName.toUpperCase();
    const bName = b.displayName.toUpperCase();
    return aName.localeCompare(bName, 'en');
};

export function getCommunityPieceFolder(pieceName: string): string {
    return join(COMMUNITY_PIECE_FOLDER, pieceName)
}


export async function findAllPiecesDirectoryInSource(): Promise<string[]> {
    const piecesPath = resolve(cwd(), 'packages', 'pieces')
    const paths = await traverseFolder(piecesPath)
    return paths.map(p => relative(cwd(), p))
}

export const pieceMetadataExists = async (
    pieceName: string,
    pieceVersion: string
): Promise<boolean> => {
    const cloudResponse = await fetch(
        `${AP_CLOUD_API_BASE}/pieces/${pieceName}?version=${pieceVersion}`
    );

    const pieceExist: Record<number, boolean> = {
        [StatusCodes.OK]: true,
        [StatusCodes.NOT_FOUND]: false
    };

    if (
        pieceExist[cloudResponse.status] === null ||
        pieceExist[cloudResponse.status] === undefined
    ) {
        throw new Error(await cloudResponse.text());
    }

    return pieceExist[cloudResponse.status];
};

export async function findNewPieces(): Promise<PieceMetadata[]> {
    const changedDistPaths = getChangedPiecesDistPaths()
    const paths = changedDistPaths ?? await findAllDistPaths()

    console.info(`[findNewPieces] scanning ${paths.length} dist paths${changedDistPaths ? ' (scoped to changed)' : ' (all)'}`)

    const changedPieces: PieceMetadata[] = []

    // Adding batches because of memory limit when we have a lot of pieces
    const batchSize = 75
    for (let i = 0; i < paths.length; i += batchSize) {
        const batch = paths.slice(i, i + batchSize)
        const batchResults = await Promise.all(batch.map(async (folderPath) => {
            const packageJson = await readPackageJson(folderPath);
            if (NON_PIECES_PACKAGES.includes(packageJson.name)) {
                return null;
            }
            const exists = await pieceMetadataExists(packageJson.name, packageJson.version)
            if (!exists) {
                try {
                    return loadPieceFromFolder(folderPath);
                } catch (ex) {
                    return null;
                }
            }
            return null;
        }))

        const validResults = batchResults.filter((piece): piece is PieceMetadata => piece !== null)
        changedPieces.push(...validResults)
    }

    return changedPieces;
}

function getChangedPiecesDistPaths(): string[] | null {
    const changedPieces = process.env['CHANGED_PIECES']
    if (!changedPieces || changedPieces.trim() === '') {
        return null
    }
    return changedPieces.split('\n').filter(Boolean).map(p => {
        return resolve(cwd(), p, 'dist')
    }).filter(p => {
        const exists = existsSync(join(p, 'package.json'))
        if (!exists) {
            console.info(`[getChangedPiecesDistPaths] skipping, no build output at ${p}`)
        }
        return exists
    })
}

export async function findAllPieces(): Promise<PieceMetadata[]> {
    const paths = await findAllDistPaths()
    const pieces = await Promise.all(paths.map((p) => loadPieceFromFolder(p)))
    return pieces.filter((p): p is PieceMetadata => p !== null).sort(byDisplayNameIgnoreCase)
}

async function findAllDistPaths(): Promise<string[]> {
    const sourcePiecesPath = resolve(cwd(), 'packages', 'pieces')
    const sourceFolders = await traverseFolder(sourcePiecesPath)
    const distPaths: string[] = []
    for (const folder of sourceFolders) {
        const distPath = join(folder, 'dist')
        const distPackageJson = join(distPath, 'package.json')
        if (existsSync(distPackageJson)) {
            distPaths.push(distPath)
        }
    }
    return distPaths
}

async function traverseFolder(folderPath: string): Promise<string[]> {
    const paths: string[] = []
    const directoryExists = await stat(folderPath).catch(() => null)

    if (directoryExists && directoryExists.isDirectory()) {
        const files = await readdir(folderPath)

        for (const file of files) {
            const filePath = join(folderPath, file)
            const fileStats = await stat(filePath)
            if (fileStats.isDirectory() && file !== 'node_modules' && file !== 'dist') {
                paths.push(...await traverseFolder(filePath))
            }
            else if (file === 'package.json') {
                paths.push(folderPath)
            }
        }
    }
    return paths
}

async function loadPieceFromFolder(folderPath: string): Promise<PieceMetadata | null> {
    try {
        const packageJson = await readPackageJson(folderPath);

        const module = await import(
            join(folderPath, 'src', 'index')
        )

        const { name: pieceName, version: pieceVersion } = packageJson
        const piece = extractPieceFromModule<SubPiece>({
            module,
            pieceName,
            pieceVersion
        });
        const originalMetadata = piece.metadata()
        const i18n = await pieceTranslation.initializeI18n(folderPath)
        const metadata = {
            ...originalMetadata,
            name: packageJson.name,
            version: packageJson.version,
            i18n
        };
        metadata.directoryPath = folderPath;
        metadata.name = packageJson.name;
        metadata.version = packageJson.version;
        metadata.minimumSupportedRelease = piece.minimumSupportedRelease ?? '0.0.0';
        metadata.maximumSupportedRelease =
            piece.maximumSupportedRelease ?? '99999.99999.9999';


        validateMetadata(metadata);
        return metadata;
    }
    catch (ex) {
        console.error(ex)
    }
    return null
}

