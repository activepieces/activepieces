import { cwd } from 'node:process'
import { resolve } from 'node:path'
import { readdir } from 'node:fs/promises'
import { PieceMetadata } from '../../../packages/shared/src'

type Piece = {
  displayName: string;
  metadata(): PieceMetadata;
}

const byDisplayNameIgnoreCase = (a: Piece, b: Piece) => {
    const aName = a.displayName.toUpperCase()
    const bName = b.displayName.toUpperCase()
    return aName.localeCompare(bName, 'en')
}

export const generateMetadata = async (): Promise<PieceMetadata[]> => {
    console.log('generateMetadata')

    const pieces: Piece[] = [];

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
