import Module from 'module'

let baselineKeys: Set<string> | null = null

function captureBaseline(): void {
    if (baselineKeys !== null) return
    baselineKeys = new Set(Object.keys(require.cache))
}

function clearPieceCache(): void {
    if (baselineKeys === null) return
    for (const key of Object.keys(require.cache)) {
        if (baselineKeys.has(key)) continue
        const mod = require.cache[key]
        if (mod?.parent) {
            mod.parent.children = mod.parent.children.filter(
                (child: NodeModule) => child !== mod,
            )
        }
        Reflect.deleteProperty(require.cache, key)
    }
    const pathCache = (Module as unknown as { _pathCache: Record<string, string> })._pathCache
    if (pathCache) {
        for (const key of Object.keys(pathCache)) {
            Reflect.deleteProperty(pathCache, key)
        }
    }
    baselineKeys = new Set(Object.keys(require.cache))
}

export const requireCacheUtils = {
    captureBaseline,
    clearPieceCache,
}
