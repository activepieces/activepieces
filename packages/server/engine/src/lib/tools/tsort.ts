import { PiecePropertyMap } from '@activepieces/pieces-framework'

export const tsort = {
    sortPropertiesByDependencies(properties: PiecePropertyMap): Record<number, string[]> {
        const inDegree: Record<string, number> = {}
        const graph: Record<string, string[]> = {}
        const depth: Record<string, number> = {}

        Object.entries(properties).forEach(([key, property]) => {
            const hasRefreshers = 'refreshers' in property && property.refreshers && Array.isArray(property.refreshers) && property.refreshers.length > 0
            if (hasRefreshers) {
                for (const refresher of property.refreshers) {
                    if (typeof properties[refresher] === 'undefined' || properties[refresher] === null) {
                        continue
                    }
                    inDegree[key] = (inDegree[key] || 0) + 1
                    graph[refresher] = graph[refresher] ?? []
                    graph[refresher].push(key)
                }
            }
            inDegree[key] = inDegree[key] ?? 0
            graph[key] = graph[key] ?? []
        })

        // Topological sort
        const order: string[] = []
        const queue = Object.entries(inDegree)
            .filter(([, degree]) => degree === 0)
            .map(([name]) => name)

        queue.forEach(property => depth[property] = 0)

        while (queue.length > 0) {
            const current = queue.shift()!
            order.push(current)

            const neighbors = graph[current] || []
            neighbors.forEach(neighbor => {
                inDegree[neighbor]--
                if (inDegree[neighbor] === 0) {
                    queue.push(neighbor)
                    depth[neighbor] = depth[current] + 1
                }
            })
        }

        const depthToPropertyMap: Record<number, string[]> = {}
        for (const [property, depthValue] of Object.entries(depth)) {
            depthToPropertyMap[depthValue] = depthToPropertyMap[depthValue] ?? []
            depthToPropertyMap[depthValue].push(property)
        }

        return depthToPropertyMap
    },
}

