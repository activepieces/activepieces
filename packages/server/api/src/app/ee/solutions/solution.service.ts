import { apId, ProjectState, Solution } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { RecordEntity } from '../../tables/record/record.entity'
import { tableService } from '../../tables/table/table.service'
import { projectDiffService } from '../projects/project-release/project-state/project-diff.service'
import { projectStateService } from '../projects/project-release/project-state/project-state.service'

const recordRepo = repoFactory(RecordEntity)

export const solutionService = (log: FastifyBaseLogger) => ({
    export: async (params: ExportParams): Promise<Solution> => {
        const state = await projectStateService(log).getCurrentState(params.projectId, log)
        const result = stripState(state)
        const tables = await tableService.list({
            projectId: params.projectId,
            limit: 99999,
            cursor: undefined,
            name: undefined,
            externalIds: undefined,
        })
        const tablesRecords: Solution['tablesRecords'] = []
        for (const table of tables.data) {
            const recordsForTable = await recordRepo().find({
                where: {
                    projectId: params.projectId,
                    tableId: table.id,
                },
                order: {
                    created: 'ASC',
                },
                relations: {
                    cells: true,
                },
            })
            tablesRecords.push(...recordsForTable)
        }

        return {
            ...result,
            name: params.name,
            description: params.description ?? '',
            tablesRecords: stripState(tablesRecords),
        }
    },
    import: async (params: ImportParams): Promise<void> => {
        const newState = setDefaultValues(replaceIdsWithMapping(params.solution), params.projectId, params.platformId)
        const currentState = await projectStateService(log).getCurrentState(params.projectId, log)
        const diffs = await projectDiffService.diff({
            newState: newState as ProjectState,
            currentState,
        })
        await projectStateService(log).apply({
            projectId: params.projectId,
            diffs,
            selectedFlowsIds: newState.flows?.map((flow) => flow.id) ?? null,
            platformId: params.platformId,
            log,
        })
        if (newState.tablesRecords?.length) {
            await recordRepo().save(newState.tablesRecords)
        }
    },
})

function stripState<T>(obj: T): T {
    const ID_KEYS_TO_NULLIFY = new Set(['projectId', 'platformId'])
    const KEYS_TO_REMOVE = new Set(['created', 'updated'])

    function recursiveStrip(val: unknown): unknown {
        if (Array.isArray(val)) {
            return val.map(recursiveStrip)
        }

        if (val && typeof val === 'object') {
            const newObj: Record<string, unknown> = {}
            for (const [key, value] of Object.entries(val)) {
                if (ID_KEYS_TO_NULLIFY.has(key)) {
                    newObj[key] = null
                }
                else if (KEYS_TO_REMOVE.has(key)) {
                    newObj[key] = undefined
                }
                else {
                    newObj[key] = recursiveStrip(value)
                }
            }
            return newObj
        }

        return val
    }

    const result = recursiveStrip(obj)
    return result as T
}

function replaceIdsWithMapping<T>(obj: T): T {
    const ID_KEYS_TO_REPLACE = new Set(['id', 'externalId', 'tableId', 'recordId', 'cellId', 'mcpId', 'toolId', 'flowId'])
    const idMap = new Map<string, string>()
    function recursiveReplace(val: unknown): unknown {
        if (Array.isArray(val)) {
            return val.map(recursiveReplace)
        }

        if (val && typeof val === 'object') {
            const newObj: Record<string, unknown> = {}
            for (const [key, value] of Object.entries(val)) {
                if (ID_KEYS_TO_REPLACE.has(key) && typeof value === 'string') {
                    if (!idMap.has(value)) {
                        idMap.set(value, apId())
                    }
                    newObj[key] = idMap.get(value)
                }
                else {
                    newObj[key] = recursiveReplace(value)
                }
            }
            return newObj
        }

        return val
    }

    const result = recursiveReplace(obj)
    return result as T
}

function setDefaultValues<T>(obj: T, projectId: string, platformId: string): T {
    const DEFAULT_VALUES = new Map<string, unknown>([
        ['created', new Date().toISOString()],
        ['updated', new Date().toISOString()],
        ['projectId', projectId],
        ['platformId', platformId],
    ])

    function recursiveSetDefault(val: unknown): unknown {
        if (Array.isArray(val)) {
            return val.map(recursiveSetDefault)
        }

        if (val && typeof val === 'object') {
            const newObj: Record<string, unknown> = {}
            for (const [key, value] of Object.entries(val)) {
                if (DEFAULT_VALUES.has(key)) {
                    newObj[key] = DEFAULT_VALUES.get(key)
                }
                else {
                    newObj[key] = recursiveSetDefault(value)
                }
            }
            return newObj
        }

        return val
    }

    const result = recursiveSetDefault(obj)
    return result as T
}

type ExportParams = {
    projectId: string
    name: string
    description?: string
}

type ImportParams = {
    solution: Solution
    projectId: string
    platformId: string
}
