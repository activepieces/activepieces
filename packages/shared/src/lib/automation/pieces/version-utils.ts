import semverMajor from 'semver/functions/major'
import semverMinor from 'semver/functions/minor'
import semverMinVersion from 'semver/ranges/min-version'

export const getPieceMajorAndMinorVersion = (pieceVersion: string): string => {
    const minimumSemver = semverMinVersion(pieceVersion)
    return minimumSemver
        ? `${semverMajor(minimumSemver)}.${semverMinor(minimumSemver)}`
        : `${semverMajor(pieceVersion)}.${semverMinor(pieceVersion)}`
}
