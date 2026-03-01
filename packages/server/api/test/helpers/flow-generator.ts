import { apId, FlowActionKind, FlowEdgeType, FlowGraphNode, FlowNodeType, FlowOperationStatus, FlowStatus, FlowTriggerKind, FlowVersion, FlowVersionState, PieceTrigger, PopulatedFlow } from '@activepieces/shared'
import { faker } from '@faker-js/faker'


export const flowGenerator = {
    simpleActionAndTrigger(externalId?: string): PopulatedFlow {
        return flowGenerator.randomizeMetadata(externalId, flowVersionGenerator.simpleActionAndTrigger())
    },
    randomizeMetadata(externalId: string | undefined, version: Omit<FlowVersion, 'flowId'>): PopulatedFlow {
        const flowId = apId()
        const clonedVersion = JSON.parse(JSON.stringify(version)) as Omit<FlowVersion, 'flowId'>
        const triggerNode = clonedVersion.graph.nodes.find(n => n.type === FlowNodeType.TRIGGER)
        if (triggerNode && triggerNode.data.kind === FlowTriggerKind.PIECE) {
            const triggerData = triggerNode.data as PieceTrigger
            triggerData.settings.propertySettings = {
                server: { type: 'MANUAL' as const },
                port: { type: 'MANUAL' as const },
                username: { type: 'MANUAL' as const },
                password: { type: 'MANUAL' as const },
            }
        }
        return {
            externalId: externalId ?? flowId,
            version: {
                ...clonedVersion,
                flowId,
            },
            operationStatus: FlowOperationStatus.NONE,
            status: faker.helpers.enumValue(FlowStatus),
            id: flowId,
            projectId: apId(),
            folderId: apId(),
            created: faker.date.recent().toISOString(),
            updated: faker.date.recent().toISOString(),
        }
    },
}

const flowVersionGenerator = {
    simpleActionAndTrigger(): Omit<FlowVersion, 'flowId'> {
        const actionId = apId()
        const triggerId = 'trigger'
        return {
            id: apId(),
            displayName: faker.animal.dog(),
            created: faker.date.recent().toISOString(),
            updated: faker.date.recent().toISOString(),
            updatedBy: apId(),
            valid: true,
            graph: {
                nodes: [
                    generateTriggerNode(triggerId),
                    generateActionNode(actionId),
                ],
                edges: [
                    {
                        id: `${triggerId}->${actionId}`,
                        source: triggerId,
                        target: actionId,
                        type: FlowEdgeType.DEFAULT as const,
                    },
                ],
            },
            state: FlowVersionState.DRAFT,
            connectionIds: [],
            agentIds: [],
            notes: [],
            schemaVersion: null,
            backupFiles: null,
        }
    },
}

function generateTriggerNode(id: string): FlowGraphNode {
    return {
        id,
        type: FlowNodeType.TRIGGER,
        data: {
            kind: FlowTriggerKind.PIECE,
            displayName: faker.hacker.noun(),
            valid: true,
            settings: {
                pieceName: faker.helpers.arrayElement(['@activepieces/piece-schedule', '@activepieces/piece-webhook']),
                pieceVersion: faker.system.semver(),
                triggerName: faker.hacker.noun(),
                input: {},
                propertySettings: {},
            },
        },
    }
}

function generateActionNode(id: string): FlowGraphNode {
    return {
        id,
        type: FlowNodeType.ACTION,
        data: {
            kind: FlowActionKind.PIECE,
            displayName: faker.hacker.noun(),
            valid: true,
            skip: false,
            settings: {
                pieceName: faker.helpers.arrayElement(['@activepieces/piece-schedule', '@activepieces/piece-webhook']),
                pieceVersion: faker.system.semver(),
                actionName: faker.hacker.noun(),
                input: {},
                propertySettings: {},
                errorHandlingOptions: {},
            },
        },
    }
}
