import { AgentOutputFieldType, AgentOutputType, AgentState, apId, McpToolType } from '@activepieces/shared'
import { faker } from '@faker-js/faker'

export const agentGenerator = {
    simpleAgent(externalId?: string): AgentState {
        return {
            externalId: externalId ?? apId(),
            displayName: faker.lorem.words(2),
            description: faker.lorem.sentence(),
            systemPrompt: faker.lorem.paragraph(),
            profilePictureUrl: faker.image.url(),
            maxSteps: faker.number.int({ min: 5, max: 20 }),
            outputType: AgentOutputType.NO_OUTPUT,
            outputFields: [],
            runCompleted: faker.number.int({ min: 0, max: 100 }),
            mcp: {
                name: faker.lorem.words(2),
                externalId: apId(),
                token: faker.string.alphanumeric(32),
                tools: [],
            },
        }
    },

    agentWithOutputFields(externalId?: string): AgentState {
        return {
            externalId: externalId ?? apId(),
            displayName: faker.lorem.words(2),
            description: faker.lorem.sentence(),
            systemPrompt: faker.lorem.paragraph(),
            profilePictureUrl: faker.image.url(),
            maxSteps: faker.number.int({ min: 5, max: 20 }),
            outputType: AgentOutputType.STRUCTURED_OUTPUT,
            outputFields: [
                {
                    displayName: 'result',
                    type: AgentOutputFieldType.TEXT,
                    description: faker.lorem.sentence(),
                },
                {
                    displayName: 'status',
                    type: AgentOutputFieldType.TEXT,
                    description: faker.lorem.sentence(),
                },
            ],
            runCompleted: faker.number.int({ min: 0, max: 100 }),
            mcp: {
                name: faker.lorem.words(2),
                externalId: apId(),
                token: faker.string.alphanumeric(32),
                tools: [
                    {
                        id: apId(),
                        externalId: apId(),
                        toolName: 'test_tool',
                        type: McpToolType.PIECE,
                        pieceMetadata: {
                            pieceName: 'test-piece',
                            pieceVersion: '1.0.0',
                            actionName: 'test_action',
                            actionDisplayName: 'Test Action',
                            logoUrl: faker.image.url(),
                        },
                        mcpId: apId(),
                        created: faker.date.recent().toISOString(),
                        updated: faker.date.recent().toISOString(),
                    },
                ],
            },
        }
    },

    agentWithMcpTools(externalId?: string): AgentState {
        return {
            externalId: externalId ?? apId(),
            displayName: faker.lorem.words(2),
            description: faker.lorem.sentence(),
            systemPrompt: faker.lorem.paragraph(),
            profilePictureUrl: faker.image.url(),
            maxSteps: faker.number.int({ min: 5, max: 20 }),
            outputType: AgentOutputType.NO_OUTPUT,
            outputFields: [],
            runCompleted: faker.number.int({ min: 0, max: 100 }),
            mcp: {
                name: faker.lorem.words(2),
                externalId: apId(),
                token: faker.string.alphanumeric(32),
                tools: [
                    {
                        id: apId(),
                        externalId: apId(),
                        toolName: 'search_web',
                        type: McpToolType.PIECE,
                        pieceMetadata: {
                            pieceName: 'web-search',
                            pieceVersion: '1.0.0',
                            actionName: 'search',
                            actionDisplayName: 'Search Web',
                            logoUrl: faker.image.url(),
                        },
                        mcpId: apId(),
                        created: faker.date.recent().toISOString(),
                        updated: faker.date.recent().toISOString(),
                    },
                    {
                        id: apId(),
                        externalId: apId(),
                        toolName: 'get_weather',
                        type: McpToolType.PIECE,
                        pieceMetadata: {
                            pieceName: 'weather',
                            pieceVersion: '1.0.0',
                            actionName: 'get_weather',
                            actionDisplayName: 'Get Weather',
                            logoUrl: faker.image.url(),
                        },
                        mcpId: apId(),
                        created: faker.date.recent().toISOString(),
                        updated: faker.date.recent().toISOString(),
                    },
                ],
            },
        }
    },
} 