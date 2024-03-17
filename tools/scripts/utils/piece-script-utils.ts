
import { readdir, stat } from 'node:fs/promises'
import { resolve, join, normalize } from 'node:path'
import { cwd } from 'node:process'
import { PieceMetadata } from '../../../packages/pieces/community/framework/src'
import { extractPieceFromModule } from '../../../packages/shared/src'
import * as semver from 'semver'
import { readPackageJson } from './files'
type Piece = {
    name: string;
    displayName: string;
    version: string;
    minimumSupportedRelease?: string;
    maximumSupportedRelease?: string;
    metadata(): Omit<PieceMetadata, 'name' | 'version'>;
};

export const PIECES_FOLDER = 'packages/pieces'
export const COMMUNITY_PIECE_FOLDER = 'packages/pieces/community'


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

export async function findPiece(pieceName: string): Promise<PieceMetadata | null> {
    const pieces = await findAllPieces()
    return pieces.find((p) => p.name === pieceName) ?? null
}

export async function findAllPiecesDirectoryInSource(): Promise<string[]> {
    const piecesPath = resolve(cwd(), 'packages', 'pieces')
    const paths = await traverseFolder(piecesPath)
    return paths
}
export async function findPieceDirectoryInSource(pieceName: string): Promise<string | null> {
    const piecesPath =  await findAllPiecesDirectoryInSource()
    const piecePath = piecesPath.find((p) => p.includes(pieceName))
    return piecePath ?? null
}

export async function findAllPieces(): Promise<PieceMetadata[]> {
    const piecesPath = resolve(cwd(), 'dist', 'packages', 'pieces')
    const paths = await traverseFolder(piecesPath)
    const pieces = await Promise.all(paths.map((p) => loadPieceFromFolder(p)))
    return pieces.filter((p): p is PieceMetadata => p !== null).sort(byDisplayNameIgnoreCase)
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
        const piece = extractPieceFromModule<Piece>({
            module,
            pieceName,
            pieceVersion
        });

        const metadata = {
            ...piece.metadata(),
            name: packageJson.name,
            version: packageJson.version
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

