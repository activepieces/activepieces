const MAX_NON_BASELINE_MODULES = 500

let baselineKeys: Set<string> | null = null

function captureBaseline(): void {
    if (baselineKeys !== null) return
    baselineKeys = new Set(Object.keys(require.cache))
}

function clearPieceCache(): void {
    if (baselineKeys === null) return
    const currentSize = Object.keys(require.cache).length
    const nonBaselineCount = currentSize - baselineKeys.size
    if (nonBaselineCount <= MAX_NON_BASELINE_MODULES) return
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
    baselineKeys = new Set(Object.keys(require.cache))
}

export const requireCacheUtils = {
    captureBaseline,
    clearPieceCache,
}
