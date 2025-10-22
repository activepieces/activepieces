import { AgentOutputFieldType } from '@activepieces/shared'
import { nanoid } from 'nanoid'
import { agentDiffService } from '../../../../../../../../src/app/ee/projects/project-release/project-state/diff/agent-diff.service'
import { agentGenerator } from '../../../../../../../helpers/agent-generator'

describe('Agent Diff Service', () => {

    it('should return the agent to delete', async () => {
        const agentTwo = agentGenerator.simpleAgent()
        const diff = agentDiffService.diff({
            currentState: {
                flows: [],
                agents: [agentTwo],
            },
            newState: {
                flows: [],
                agents: [],
            },
        })
        expect(diff.length).toBe(1)
        expect(diff[0].type).toBe('DELETE_AGENT')
        expect(diff[0].agentState.externalId).toBe(agentTwo.externalId)
    })

    it('should return the agent to create', async () => {
        const agentTwo = agentGenerator.simpleAgent()
        const diff = agentDiffService.diff({
            currentState: {
                flows: [],
                agents: [],
            },
            newState: {
                flows: [],
                agents: [agentTwo],
            },
        })
        expect(diff.length).toBe(1)
        expect(diff[0].type).toBe('CREATE_AGENT')
        expect(diff[0].agentState).toBe(agentTwo)
    })

    it('should return the agent to create if the mapping is invalid', async () => {
        const agentOne = agentGenerator.simpleAgent(nanoid())
        const agentTwo = agentGenerator.simpleAgent()
        const diff = agentDiffService.diff({
            currentState: {
                flows: [],
                agents: [agentTwo],
            },
            newState: {
                flows: [],
                agents: [agentOne],
            },
        })
        const sortedAgents = [...diff].sort((a, b) => a.type.localeCompare(b.type))
        expect(sortedAgents).toEqual([
            {
                type: 'CREATE_AGENT',
                agentState: agentOne,
            },
            {
                type: 'DELETE_AGENT',
                agentState: {
                    externalId: agentTwo.externalId,
                },
            },
        ])
    })

    it('should return the agent to update', async () => {
        const agentTwo = agentGenerator.simpleAgent()
        const agentOne = agentGenerator.simpleAgent(agentTwo.externalId)
        agentOne.displayName = 'Updated Agent Name'

        const diff = agentDiffService.diff({
            currentState: {
                flows: [],
                agents: [agentOne],
            },
            newState: {
                flows: [],
                agents: [agentTwo],
            },
        })
        expect(diff.length).toBe(1)
        expect(diff[0]).toEqual({
            type: 'UPDATE_AGENT',
            agentState: agentOne,
            newAgentState: agentTwo,
        })
    })

    it('should skip the agent to update if the agent is not changed', async () => {
        const agentOne = agentGenerator.simpleAgent()
        const agentOneDist = agentGenerator.simpleAgent(agentOne.externalId)
        agentOneDist.displayName = agentOne.displayName

        const diff = agentDiffService.diff({
            currentState: {
                flows: [],
                agents: [agentOne],
            },
            newState: {
                flows: [],
                agents: [agentOneDist],
            },
        })
        expect(diff).toEqual([
            {
                type: 'UPDATE_AGENT',
                agentState: agentOne,
                newAgentState: agentOneDist,
            },
        ])
    })

    it('should return the agent to create, update and delete', async () => {
        const agentOne = agentGenerator.simpleAgent()
        const agentTwo = agentGenerator.simpleAgent()
        const agentThree = agentGenerator.simpleAgent()
        const agentOneDist = agentGenerator.simpleAgent(agentOne.externalId)
        agentOneDist.displayName = 'Updated Agent One'

        const diff = agentDiffService.diff({
            currentState: {
                flows: [],
                agents: [agentOne, agentThree],
            },
            newState: {
                flows: [],
                agents: [agentOneDist, agentTwo],
            },
        })
        expect(diff.length).toBe(3)
        expect(diff).toEqual(
            expect.arrayContaining([
                {
                    type: 'DELETE_AGENT',
                    agentState: expect.objectContaining({
                        externalId: agentThree.externalId,
                    }),
                },
                {
                    type: 'CREATE_AGENT',
                    agentState: expect.objectContaining({
                        externalId: agentTwo.externalId,
                        displayName: agentTwo.displayName,
                        systemPrompt: agentTwo.systemPrompt,
                        mcp: agentTwo.mcp,
                    }),
                },
                {
                    type: 'UPDATE_AGENT',
                    agentState: expect.objectContaining({
                        externalId: agentOne.externalId,
                        displayName: agentOne.displayName,
                        systemPrompt: agentOne.systemPrompt,
                        mcp: agentOne.mcp,
                    }),
                    newAgentState: expect.objectContaining({
                        externalId: agentOneDist.externalId,
                        displayName: agentOneDist.displayName,
                        systemPrompt: agentOneDist.systemPrompt,
                        mcp: agentOneDist.mcp,
                    }),
                },
            ]),
        )
    })

    it('should detect system prompt changes in agent update', async () => {
        const agentOne = agentGenerator.simpleAgent()
        const agentOneDist = agentGenerator.simpleAgent(agentOne.externalId)
        agentOneDist.systemPrompt = 'Updated system prompt for testing'

        const diff = agentDiffService.diff({
            currentState: {
                flows: [],
                agents: [agentOne],
            },
            newState: {
                flows: [],
                agents: [agentOneDist],
            },
        })
        expect(diff.length).toBe(1)
        expect(diff[0].type).toBe('UPDATE_AGENT')
        expect(diff[0].agentState).toBe(agentOne)
    })

    it('should detect output fields changes', async () => {
        const agentOne = agentGenerator.agentWithOutputFields()
        const agentOneDist = agentGenerator.agentWithOutputFields(agentOne.externalId)
        if (agentOneDist.outputFields) {
            agentOneDist.outputFields.push({
                displayName: 'New Field',
                type: AgentOutputFieldType.TEXT,
                description: 'A new output field',
            })
        }

        const diff = agentDiffService.diff({
            currentState: {
                flows: [],
                agents: [agentOne],
            },
            newState: {
                flows: [],
                agents: [agentOneDist],
            },
        })
        expect(diff.length).toBe(1)
        expect(diff[0].type).toBe('UPDATE_AGENT')
    })

    it('should detect MCP tools changes', async () => {
        const agentOne = agentGenerator.agentWithMcpTools()
        const agentOneDist = agentGenerator.agentWithMcpTools(agentOne.externalId)
        // Change the MCP name to trigger an update
        agentOneDist.mcp.name = 'Updated MCP Name'

        const diff = agentDiffService.diff({
            currentState: {
                flows: [],
                agents: [agentOne],
            },
            newState: {
                flows: [],
                agents: [agentOneDist],
            },
        })
        expect(diff.length).toBe(1)
        expect(diff[0].type).toBe('UPDATE_AGENT')
    })

    it('should handle multiple agents with different operations', async () => {
        const agentOne = agentGenerator.simpleAgent()
        const agentTwo = agentGenerator.simpleAgent()
        const agentThree = agentGenerator.simpleAgent()
        const agentFour = agentGenerator.simpleAgent()
        
        const agentOneUpdated = agentGenerator.simpleAgent(agentOne.externalId)
        agentOneUpdated.displayName = 'Updated Agent One'
        
        const agentTwoUpdated = agentGenerator.simpleAgent(agentTwo.externalId)
        agentTwoUpdated.systemPrompt = 'Updated system prompt'

        const diff = agentDiffService.diff({
            currentState: {
                flows: [],
                agents: [agentOne, agentTwo, agentThree],
            },
            newState: {
                flows: [],
                agents: [agentOneUpdated, agentTwoUpdated, agentFour],
            },
        })
        expect(diff.length).toBe(4)
        
        const createOperations = diff.filter(op => op.type === 'CREATE_AGENT')
        const updateOperations = diff.filter(op => op.type === 'UPDATE_AGENT')
        const deleteOperations = diff.filter(op => op.type === 'DELETE_AGENT')
        
        expect(createOperations).toHaveLength(1)
        expect(updateOperations).toHaveLength(2)
        expect(deleteOperations).toHaveLength(1)
        
        expect(createOperations[0].agentState.externalId).toBe(agentFour.externalId)
        expect(deleteOperations[0].agentState.externalId).toBe(agentThree.externalId)
    })
}) 