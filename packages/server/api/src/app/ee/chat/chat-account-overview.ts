import { ProjectId } from '@activepieces/core-utils'
import { FastifyBaseLogger } from 'fastify'
import { appConnectionService } from '../../app-connection/app-connection-service/app-connection-service'
import { flowService } from '../../flows/flow/flow.service'
import { tableService } from '../../tables/table/table.service'

const NAME_SAMPLE_LIMIT = 5
const MAX_CONNECTION_APPS = 15
const MAX_NAME_LENGTH = 40

function pieceShortName(fullName: string): string {
    return fullName.replace('@activepieces/piece-', '')
}

function sumMap(map: Map<ProjectId, number>): number {
    let total = 0
    for (const value of map.values()) {
        total += value
    }
    return total
}

function truncateName(name: string): string {
    const trimmed = name.trim()
    return trimmed.length > MAX_NAME_LENGTH ? `${trimmed.slice(0, MAX_NAME_LENGTH - 1)}…` : trimmed
}

function formatRecent(names: string[]): string {
    return names.length > 0 ? ` Recent: ${names.map(truncateName).join(', ')}.` : ''
}

async function fetchAccountOverview({ projectIds, platformId, log }: {
    projectIds: ProjectId[]
    platformId: string
    log: FastifyBaseLogger
}): Promise<AccountOverview> {
    const [totalFlowsMap, activeFlowsMap, recentFlowNames, totalTablesMap, recentTableNames, connectionsByPiece] = await Promise.all([
        flowService(log).countFlowsByProjects(projectIds),
        flowService(log).countActiveFlowsByProjects(projectIds),
        flowService(log).listRecentFlowNamesByProjects({ projectIds, limit: NAME_SAMPLE_LIMIT }),
        tableService.countTablesByProjects(projectIds),
        tableService.listRecentTableNamesByProjects({ projectIds, limit: NAME_SAMPLE_LIMIT }),
        appConnectionService(log).countConnectionsByPiece({ projectIds, platformId }),
    ])
    return {
        projectCount: projectIds.length,
        totalFlows: sumMap(totalFlowsMap),
        activeFlows: sumMap(activeFlowsMap),
        totalTables: sumMap(totalTablesMap),
        recentFlowNames,
        recentTableNames,
        connectionsByPiece,
    }
}

// A rough, cross-project snapshot of what the user has, injected into the system prompt so the
// agent starts with a sense of the workspace instead of discovering it reactively. Deliberately a
// HINT, not an inventory: framed as approximate and partial so the agent still reaches for the list
// tools for specifics. Mirrors buildConnectionInventoryNote's style and empty-state handling.
function buildAccountOverviewNote({ overview }: { overview: AccountOverview }): string {
    const { projectCount, totalFlows, activeFlows, totalTables, recentFlowNames, recentTableNames, connectionsByPiece } = overview
    const totalConnections = connectionsByPiece.reduce((sum, c) => sum + c.count, 0)

    if (totalFlows === 0 && totalTables === 0 && totalConnections === 0) {
        return '\n\n## Your workspace at a glance (rough totals)\nThis user hasn\'t built anything yet — no flows, tables, or connections across the project(s) they can access. They\'re starting fresh: lead by proposing concrete first automations rather than asking them to point you at existing work.'
    }

    const multiProject = projectCount > 1
    const scopePhrase = multiProject ? `across the ${projectCount} projects they can access` : 'in their workspace'
    const projectClause = multiProject ? ` across ${projectCount} projects` : ''

    const lines: string[] = ['\n\n## Your workspace at a glance (rough totals)']
    lines.push(`A cross-project snapshot of what this user has ${scopePhrase}. The **counts are real** — if they ask whether they have any flows/tables or how many, answer straight from this (then offer to list); don't call a tool just to restate it. The recent names are a small sample and the per-app list may be truncated, so list (\`ap_list_across_projects\` / \`ap_list_tables\` / \`ap_list_connections\`) only to show the actual items, act on exact current data, or check whether a specific item exists beyond what's shown.`)
    lines.push(`- Flows: ${totalFlows} (${activeFlows} live)${projectClause}.${formatRecent(recentFlowNames)}`)
    lines.push(`- Tables: ${totalTables}.${formatRecent(recentTableNames)}`)

    if (connectionsByPiece.length > 0) {
        const sorted = [...connectionsByPiece].sort((a, b) => b.count - a.count)
        const shown = sorted.slice(0, MAX_CONNECTION_APPS)
        const remainder = sorted.length - shown.length
        const appList = shown.map((c) => `${pieceShortName(c.pieceName)} ×${c.count}`).join(', ')
        const moreNote = remainder > 0 ? ` (+${remainder} more app${remainder === 1 ? '' : 's'})` : ''
        const connScope = multiProject ? ' (across all their projects)' : ''
        lines.push(`- Connections by app${connScope}: ${appList}${moreNote}.`)
    }
    else {
        lines.push('- Connections: none connected yet.')
    }

    return lines.join('\n')
}

export const chatAccountOverview = {
    fetch: fetchAccountOverview,
    buildNote: buildAccountOverviewNote,
}

export type AccountOverview = {
    projectCount: number
    totalFlows: number
    activeFlows: number
    totalTables: number
    recentFlowNames: string[]
    recentTableNames: string[]
    connectionsByPiece: { pieceName: string, count: number }[]
}
