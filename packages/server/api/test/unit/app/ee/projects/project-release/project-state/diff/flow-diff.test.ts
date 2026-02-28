import { FlowNodeType, FlowTriggerKind, FlowVersion, PieceTrigger } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { projectDiffService } from '../../../../../../../../src/app/ee/projects/project-release/project-state/project-diff.service'
import { projectStateService } from '../../../../../../../../src/app/ee/projects/project-release/project-state/project-state.service'
import { system } from '../../../../../../../../src/app/helper/system/system'
import { flowGenerator } from '../../../../../../../helpers/flow-generator'

vi.mock('../../../../../../../../src/app/flows/flow-version/migrations', () => ({
    flowMigrations: {
        apply: async (version: FlowVersion) => version,
    },
}))

const logger = system.globalLogger()
describe('Flow Diff Service', () => {

    it('should return the flow to delete', async () => {
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const diff = await projectDiffService.diff({
            currentState: {
                flows: [flowTwo],
            },
            newState: {
                flows: [],
            },
        })
        expect(diff.flows.length).toBe(1)
        expect(diff.flows[0].type).toBe('DELETE_FLOW')
        expect(diff.flows[0].flowState).toBe(flowTwo)
    })

    it('should return the flow to create', async () => {
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const diff = await projectDiffService.diff({
            currentState: {
                flows: [],
            },
            newState: {
                flows: [flowTwo],
            },
        })
        expect(diff.flows.length).toBe(1)
        expect(diff.flows[0].type).toBe('CREATE_FLOW')
        expect(diff.flows[0].flowState).toBe(flowTwo)
    })

    it('should return the flow to create If the mapping is invalid', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger(nanoid())
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const diff = await projectDiffService.diff({
            currentState: {
                flows: [flowTwo],
            },
            newState: {
                flows: [flowOne],
            },
        })
        expect(diff.flows).toEqual([
            {
                type: 'DELETE_FLOW',
                flowState: flowTwo,
            },
            {
                type: 'CREATE_FLOW',
                flowState: flowOne,
            },
        ])
    })

    it('should return the flow to update', async () => {
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const flowOne = flowGenerator.simpleActionAndTrigger(flowTwo.id)

        const diff = await projectDiffService.diff({
            currentState: {
                flows: [flowOne],
            },
            newState: {
                flows: [flowTwo],
            },
        })
        expect(diff.flows.length).toBe(1)
        expect(diff.flows[0]).toEqual({
            type: 'UPDATE_FLOW',
            flowState: flowOne,
            newFlowState: flowTwo,
        })
    })


    it('should skip the flow to update if the flow is not changed', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger()
        const flowOneDist = flowGenerator.randomizeMetadata(undefined, flowOne.version)
        // Ensure trigger propertySettings match (randomizeMetadata randomizes them)
        const triggerOne = getTriggerData(flowOne.version)
        const triggerOneDist = getTriggerData(flowOneDist.version)
        triggerOneDist.settings.propertySettings = triggerOne.settings.propertySettings
        flowOne.externalId = flowOneDist.id

        const stateOne = await projectStateService(logger).getFlowState(flowOne)
        const stateTwo = await projectStateService(logger).getFlowState(flowOneDist)
        const diff = await projectDiffService.diff({
            currentState: {
                flows: [stateOne],
            },
            newState: {
                flows: [stateTwo],
            },
        })
        expect(diff.flows).toEqual([])
    })

    it('should return the flow to create, update and delete', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger()
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const flowThree = flowGenerator.simpleActionAndTrigger()
        const flowOneDist = flowGenerator.simpleActionAndTrigger()
        flowOne.externalId = flowOneDist.id
        const diff = await projectDiffService.diff({
            currentState: {
                flows: [flowOne, flowThree],
            },
            newState: {
                flows: [flowOneDist, flowTwo],
            },
        })
        expect(diff.flows.length).toBe(3)
        expect(diff.flows).toEqual([
            {
                type: 'DELETE_FLOW',
                flowState: flowThree,
            },
            {
                type: 'CREATE_FLOW',
                flowState: flowTwo,
            },
            {
                type: 'UPDATE_FLOW',
                flowState: flowOne,
                newFlowState: flowOneDist,
            },
        ])
    })

    it('should compare piece version only based on major and minor version', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger()
        const flowTwo = JSON.parse(JSON.stringify(flowOne))
        getTriggerData(flowTwo.version).settings.pieceVersion = '0.1.1'
        getTriggerData(flowOne.version).settings.pieceVersion = '0.1.0'
        const diff = await projectDiffService.diff({
            currentState: {
                flows: [flowOne],
            },
            newState: {
                flows: [flowTwo],
            },
        })
        expect(diff.flows).toEqual([])
    })

    it('should detect major piece version change', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger()
        const flowTwo = JSON.parse(JSON.stringify(flowOne))
        getTriggerData(flowTwo.version).settings.pieceVersion = '0.2.1'
        getTriggerData(flowOne.version).settings.pieceVersion = '0.1.0'
        const diff = await projectDiffService.diff({
            currentState: {
                flows: [flowOne],
            },
            newState: {
                flows: [flowTwo],
            },
        })
        expect(diff.flows).toEqual([
            {
                type: 'UPDATE_FLOW',
                flowState: flowOne,
                newFlowState: flowTwo,
            },
        ])
    })


    it('should not detect flow as changed when trigger properties are in different order', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger()
        const flowStateOne = await projectStateService(logger).getFlowState(flowOne)

        // Create a flow with identical trigger content but different node property ordering
        const triggerOne = flowOne.version.graph.nodes.find(n => n.type === FlowNodeType.TRIGGER)!
        const flowTwo = {
            ...flowOne,
            version: {
                ...flowOne.version,
                graph: {
                    ...flowOne.version.graph,
                    nodes: flowOne.version.graph.nodes.map(node => {
                        if (node.type !== FlowNodeType.TRIGGER) return node
                        // Reorder data properties but keep same content
                        return {
                            id: node.id,
                            type: node.type,
                            data: {
                                settings: node.data.settings,
                                valid: node.data.valid,
                                kind: node.data.kind,
                                name: node.data.name,
                                displayName: node.data.displayName,
                            },
                        }
                    }),
                },
            },
        }
        const flowStateTwo = await projectStateService(logger).getFlowState(flowTwo)

        // Also test with nested trigger.settings properties in different order
        const triggerData = triggerOne.data as PieceTrigger
        const flowThree = {
            ...flowOne,
            version: {
                ...flowOne.version,
                graph: {
                    ...flowOne.version.graph,
                    nodes: flowOne.version.graph.nodes.map(node => {
                        if (node.type !== FlowNodeType.TRIGGER) return node
                        // Reorder settings properties but keep same content
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                settings: {
                                    propertySettings: triggerData.settings.propertySettings,
                                    input: triggerData.settings.input,
                                    triggerName: triggerData.settings.triggerName,
                                    pieceVersion: triggerData.settings.pieceVersion,
                                    pieceName: triggerData.settings.pieceName,
                                },
                            },
                        }
                    }),
                },
            },
        }
        const flowStateThree = await projectStateService(logger).getFlowState(flowThree)

        // Test flowOne vs flowTwo (different trigger top-level property order)
        const diff1 = await projectDiffService.diff({
            currentState: {
                flows: [flowStateOne],
            },
            newState: {
                flows: [flowStateTwo],
            },
        })

        // Test flowOne vs flowThree (different trigger.settings property order)
        const diff2 = await projectDiffService.diff({
            currentState: {
                flows: [flowStateOne],
            },
            newState: {
                flows: [flowStateThree],
            },
        })

        // Both should detect no changes despite different property ordering
        expect(diff1.flows).toEqual([])
        expect(diff2.flows).toEqual([])
    })
})

function getTriggerData(version: FlowVersion): PieceTrigger {
    const triggerNode = version.graph.nodes.find(n => n.type === FlowNodeType.TRIGGER)!
    return triggerNode.data as PieceTrigger
}
