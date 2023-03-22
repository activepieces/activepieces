import assert from 'node:assert'
import { PieceMetadata } from '../../../packages/shared/src'
import { getAvailablePieceNames } from '../utils/get-available-piece-names'
import { readPackageJson, PackageJson } from '../utils/files'

type Piece = {
    name: string
    displayName: string
    metadata(): PieceMetadata
}

const extractPieceNameFromPackageJson = (packageJson: PackageJson): string => {
    const { name } = packageJson
    const pieceNameRegex = /^@activepieces\/piece-(?<pieceName>.+)$/
    const matchResult = name.match(pieceNameRegex)
    const pieceName = matchResult?.groups?.pieceName

    assert(pieceName, `[generateMetadata] package name "${name}" is not on the form "@activepieces/piece-xyz`)

    return pieceName;
}

const byDisplayNameIgnoreCase = (a: Piece, b: Piece) => {
    const aName = a.displayName.toUpperCase()
    const bName = b.displayName.toUpperCase()
    return aName.localeCompare(bName, 'en')
}

export const generateMetadata = async (): Promise<PieceMetadata[]> => {
    console.log('generateMetadata')

    const pieces: Piece[] = [];

    const piecePackageNames = await getAvailablePieceNames();

    for (const packageName of piecePackageNames) {
        const packagePath = `packages/pieces/${packageName}`

        const packageJson = await readPackageJson(packagePath)
        const pieceName = extractPieceNameFromPackageJson(packageJson)

        const module = await import(`${packagePath}/src/index.ts`)
        const piece = Object.values<Piece>(module)[0]

        piece.name = pieceName
        pieces.push(piece)
    }

    pieces.sort(byDisplayNameIgnoreCase)

    return pieces.map(p => p.metadata())
}
