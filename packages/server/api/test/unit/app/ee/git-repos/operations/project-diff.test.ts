
import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'
import { projectDiffService } from '../../../../../../src/app/ee/git-repos/project-diff/project-diff.service'
import { ProjectMappingState } from '../../../../../../src/app/ee/git-repos/project-diff/project-mapping-state'
import { flowGenerator } from '../../../../../helpers/flow-generator'



describe('Project Diff Service', () => {

    it('should return the flow to delete', async () => {
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const toFlows = [flowTwo]
        const diff = projectDiffService.diff({
            fromFlows: [],
            destinationFlows: toFlows,
            mapping: ProjectMappingState.empty(),
        })
        expect(diff.length).toBe(1)
        expect(diff[0].type).toBe('DELETE_FLOW')
        expect(diff[0].flow).toBe(flowTwo)
    })

    it('should return the flow to create', async () => {
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const diff = projectDiffService.diff({
            fromFlows: [flowTwo],
            destinationFlows: [],
            mapping: ProjectMappingState.empty(),
        })
        expect(diff.length).toBe(1)
        expect(diff[0].type).toBe('CREATE_FLOW')
        expect(diff[0].flow).toBe(flowTwo)
    })

    it('should return the flow to create If the mapping is invalid', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger()
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const diff = projectDiffService.diff({
            fromFlows: [flowOne],
            destinationFlows: [flowTwo],
            mapping: ProjectMappingState.empty().mapFlow({
                sourceId: nanoid(),
                targetId: flowTwo.id,
            }),
        })
        expect(diff).toEqual([
            {
                type: 'DELETE_FLOW',
                flow: flowTwo,
            },
            {
                type: 'CREATE_FLOW',
                flow: flowOne,
            },
        ])
    })

    it('should return the flow to update', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger()
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const diff = projectDiffService.diff({
            fromFlows: [flowOne],
            destinationFlows: [flowTwo],
            mapping: ProjectMappingState.empty().mapFlow({
                sourceId: flowOne.id,
                targetId: flowTwo.id,
            }),
        })
        expect(diff.length).toBe(1)
        expect(diff[0]).toEqual({
            type: 'UPDATE_FLOW',
            flow: flowOne,
            targetFlow: flowTwo,
        })
    })

    it('should skip the flow to update if the flow is not changed', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger()
        const flowOneDist = flowGenerator.randomizeMetadata(flowOne.version)
        flowOneDist.version.trigger.settings.inputUiInfo = faker.airline.airplane()
        const diff = projectDiffService.diff({
            fromFlows: [flowOne],
            destinationFlows: [flowOneDist],
            mapping: ProjectMappingState.empty().mapFlow({
                sourceId: flowOne.id,
                targetId: flowOneDist.id,
            }),
        })
        expect(diff).toEqual([])
    })

    it('should return the flow to create, update and delete', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger()
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const flowThree = flowGenerator.simpleActionAndTrigger()

        const flowOneDist = flowGenerator.simpleActionAndTrigger()
        const flowThreeDist = flowGenerator.randomizeMetadata(flowThree.version)
        const diff = projectDiffService.diff({
            fromFlows: [flowOne, flowTwo],
            destinationFlows: [flowOneDist, flowThreeDist],
            mapping: ProjectMappingState.empty().mapFlow({
                sourceId: flowOne.id,
                targetId: flowOneDist.id,
            }),
        })
        expect(diff.length).toBe(3)
        expect(diff).toEqual([
            {
                type: 'DELETE_FLOW',
                flow: flowThreeDist,
            },
            {
                type: 'CREATE_FLOW',
                flow: flowTwo,
            },
            {
                type: 'UPDATE_FLOW',
                flow: flowOne,
                targetFlow: flowOneDist,
            },
        ])
    })
})