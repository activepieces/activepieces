import { PopulatedFlow, isNil } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export class ProjectMappingState {
    flows: Record<string, {
        sourceId: string
    }>

    constructor(data: { flows: Record<string, { sourceId: string }> }) {
        this.flows = data.flows
    }

    mapFlow({ sourceId, targetId }: { sourceId: string, targetId: string }): ProjectMappingState {
        return new ProjectMappingState({
            ...this,
            flows: {
                ...this.flows,
                [targetId]: {
                    sourceId,
                },
            },
        })
    }

    deleteFlow(targetId: string): ProjectMappingState {
        const { [targetId]: _, ...rest } = this.flows
        return new ProjectMappingState({
            ...this,
            flows: rest,
        })
    }

    reverse(): ProjectMappingState {
        const reversed: Record<string, { sourceId: string }> = {}
        for (const [targetflowId, state] of Object.entries(this.flows)) {
            reversed[state.sourceId] = {
                sourceId: targetflowId,
            }
        }
        return new ProjectMappingState({
            ...this,
            flows: reversed,
        })
    }

    findSourceId(targetflowId: string): string | undefined {
        const state = this.flows[targetflowId]
        if (isNil(state)) {
            return undefined
        }
        return state.sourceId
    }
    
    findTargetId(sourceId: string): string | undefined {
        return Object.entries(this.flows).find(([_, value]) => value.sourceId === sourceId)?.[0]
    }

    static from(data: ProjectMappingState): ProjectMappingState {
        return new ProjectMappingState(data)
    }

    static empty(): ProjectMappingState {
        return new ProjectMappingState({
            flows: {},
        })
    }

}

export const ProjectState = Type.Object({
    flows: Type.Array(PopulatedFlow),
})

export type ProjectState = Static<typeof ProjectState>

