import { cwd } from 'node:process'
import { resolve } from 'node:path'
import { readdir } from 'node:fs/promises'

type Piece = {
    displayName: string;
    metadata(): unknown;
}

const byDisplayNameIgnoreCase = (a: Piece, b: Piece) => {
    const aName = a.displayName.toUpperCase()
    const bName = b.displayName.toUpperCase()
    return aName.localeCompare(bName, 'en')
}

export const generateMetadata = async (): Promise<unknown[]> => {
    console.log('generateMetadata')

    const piecePath = resolve(cwd(), 'packages', 'pieces', 'apps', 'src', 'lib')
    const pieceDirectories = await readdir(piecePath)

    const pieces: Piece[] = [];

    /* pieces that aren't yet migrated to a standalone package */
    for (const pieceDirectory of pieceDirectories) {
        const index = resolve(piecePath, pieceDirectory, 'index.ts')
        const module = await import(index)
        const piece = Object.values<Piece>(module)[0]
        pieces.push(piece)
    }

    const frameworkPackages = ['framework', 'apps']
    const piecePackagePath = resolve(cwd(), 'packages', 'pieces')
    const piecePackageDirectories = await readdir(piecePackagePath)
    const filteredPiecePackageDirectories = piecePackageDirectories.filter(d => !frameworkPackages.includes(d))

    /* pieces that are migrated to a standalone package */
    for (const pieceDirectory of filteredPiecePackageDirectories) {
        const index = resolve(piecePackagePath, pieceDirectory, 'src', 'index.ts')
        const module = await import(index)
        const piece = Object.values<Piece>(module)[0]
        pieces.push(piece)
    }

    pieces.sort(byDisplayNameIgnoreCase)

    return pieces.map(p => p.metadata())
}
