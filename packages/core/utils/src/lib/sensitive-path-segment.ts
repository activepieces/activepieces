export function escapeSensitivePathSegment(segment: string): string {
    return segment.replace(/[\\.]/g, (match) => `\\${match}`)
}
