
import { faker } from '@faker-js/faker'
import { nanoid } from 'nanoid'
import { projectDiffService } from '../../../../../../src/app/ee/project-release/project-state/project-diff.service'
import { flowGenerator } from '../../../../../helpers/flow-generator'

describe('Project Diff Service', () => {

    it('should return the flow to delete', async () => {
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const diff = projectDiffService.diff({
            currentState: {
                flows: [flowTwo],
            },
            newState: {
                flows: [],
            },
        })
        expect(diff.length).toBe(1)
        expect(diff[0].type).toBe('DELETE_FLOW')
        expect(diff[0].flowState).toBe(flowTwo)
    })

    it('should return the flow to create', async () => {
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const diff = projectDiffService.diff({
            currentState: {
                flows: [],
            },
            newState: {
                flows: [flowTwo],
            },
        })
        expect(diff.length).toBe(1)
        expect(diff[0].type).toBe('CREATE_FLOW')
        expect(diff[0].flowState).toBe(flowTwo)
    })

    it('should return the flow to create If the mapping is invalid', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger(nanoid())
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const diff = projectDiffService.diff({
            currentState: {
                flows: [flowTwo],
            },
            newState: {
                flows: [flowOne],
            },
        })
        expect(diff).toEqual([
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

        const diff = projectDiffService.diff({
            currentState: {
                flows: [flowOne],
            },
            newState: {
                flows: [flowTwo],
            },
        })
        expect(diff.length).toBe(1)
        expect(diff[0]).toEqual({
            type: 'UPDATE_FLOW',
            flowState: flowOne,
            newFlowState: flowTwo,
        })
    })


    it('should skip the flow to update if the flow is not changed', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger()
        const flowOneDist = flowGenerator.randomizeMetadata(undefined, flowOne.version)
        flowOneDist.version.trigger.settings.inputUiInfo = faker.airline.airplane()
        flowOne.externalId = flowOneDist.id

        const diff = projectDiffService.diff({
            currentState: {
                flows: [flowOne],
            },
            newState: {
                flows: [flowOneDist],
            },
        })
        expect(diff).toEqual([])
    })

    it('should return the flow to create, update and delete', async () => {
        const flowOne = flowGenerator.simpleActionAndTrigger()
        const flowTwo = flowGenerator.simpleActionAndTrigger()
        const flowThree = flowGenerator.simpleActionAndTrigger()
        const flowOneDist = flowGenerator.simpleActionAndTrigger()
        flowOne.externalId = flowOneDist.id
        const diff = projectDiffService.diff({
            currentState: {
                flows: [flowOne, flowThree],
            },
            newState: {
                flows: [flowOneDist, flowTwo],
            },
        })
        expect(diff.length).toBe(3)
        expect(diff).toEqual([
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
})