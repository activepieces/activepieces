import { Solution } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { projectDiffService } from '../projects/project-release/project-state/project-diff.service'
import { projectStateService } from '../projects/project-release/project-state/project-state.service'

export const solutionService = (log: FastifyBaseLogger) => ({
    export: async (params: ExportParams): Promise<Solution> => {
        const state = await projectStateService(log).getProjectState(params.projectId, log)
        return {
            state,
            name: params.name,
            description: params.description ?? '',
        }
    },
    import: async (params: ImportParams): Promise<void> => {
        const currentState = await projectStateService(log).getProjectState(params.projectId, log)
        const newState = params.solution.state
        const diffs = await projectDiffService.diff({
            newState,
            currentState,
        })
        const filteredDiffs = await projectDiffService.filterDeleteOperation(diffs)
        await projectStateService(log).apply({
            projectId: params.projectId,
            diffs: filteredDiffs,
            platformId: params.platformId,
            log,
        })
    },
})



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
