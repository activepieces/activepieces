import { PieceMetadata } from '../../../packages/pieces/framework/src'
import * as semver from 'semver'

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

export const validateMetadata = (pieceMetadata: PieceMetadata): void => {
  console.info(`[validateMetadata] pieceName=${pieceMetadata.name}`)
  validateSupportedRelease(
    pieceMetadata.minimumSupportedRelease,
    pieceMetadata.maximumSupportedRelease,
  )
}
