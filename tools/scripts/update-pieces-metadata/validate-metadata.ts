import { compareSemVer, semVerRegex } from '../../../packages/shared/src'
import { PieceMetadata } from '../../../packages/pieces/framework/src'

const validateSupportedRelease = (minRelease: string | undefined, maxRelease: string | undefined) => {
  if (minRelease !== undefined && !semVerRegex.test(minRelease)) {
    throw Error(`[validateSupportedRelease] "minimumSupportedRelease" should match ${semVerRegex.source}`)
  }

  if (maxRelease !== undefined && !semVerRegex.test(maxRelease)) {
    throw Error(`[validateSupportedRelease] "maximumSupportedRelease" should match ${semVerRegex.source}`)
  }

  if (minRelease !== undefined && maxRelease !== undefined && compareSemVer(minRelease, maxRelease) === 1) {
    throw Error(`[validateSupportedRelease] "minimumSupportedRelease" should be less than "maximumSupportedRelease`)
  }
}

export const validateMetadata = (pieceMetadata: PieceMetadata): void => {
  console.info(`[validateMetadata] pieceName=${pieceMetadata.name}`)
  validateSupportedRelease(
    pieceMetadata.minimumSupportedRelease,
    pieceMetadata.maximumSupportedRelease,
  )
}
