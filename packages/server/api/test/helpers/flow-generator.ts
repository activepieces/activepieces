import { apId, FlowAction, FlowActionType, FlowStatus, FlowTrigger, FlowTriggerType, FlowVersion, FlowVersionState, PopulatedFlow } from '@activepieces/shared'
import { faker } from '@faker-js/faker'


export const flowGenerator = {
    simpleActionAndTrigger(externalId?: string): PopulatedFlow {
        return flowGenerator.randomizeMetadata(externalId, flowVersionGenerator.simpleActionAndTrigger())
    },
    randomizeMetadata(externalId: string | undefined, version: Omit<FlowVersion, 'flowId'>): PopulatedFlow {
        const flowId = apId()
        const result = {
            externalId: externalId ?? flowId,
            version: {
                ...version,
                trigger: randomizeTriggerMetadata(version.trigger),
                flowId,
            },
            schedule: null,
            status: faker.helpers.enumValue(FlowStatus),
            id: flowId,
            projectId: apId(),
            folderId: apId(),
            created: faker.date.recent().toISOString(),
            updated: faker.date.recent().toISOString(),
        }
        return result
    },
}

const flowVersionGenerator = {
    simpleActionAndTrigger(): Omit<FlowVersion, 'flowId'> {
        return {
            id: apId(),
            displayName: faker.animal.dog(),
            created: faker.date.recent().toISOString(),
            updated: faker.date.recent().toISOString(),
            updatedBy: apId(),
            valid: true,
            trigger: {
                ...randomizeTriggerMetadata(generateTrigger()),
                nextAction: generateAction(),
            },
            state: FlowVersionState.DRAFT,
            connectionIds: [],
            agentIds: [],
        }
    },
}

function randomizeTriggerMetadata(trigger: FlowTrigger): FlowTrigger {
    return {
        ...trigger,
        settings: {
            ...trigger.settings,
            propertySettings: {
                server: faker.internet.url(),
                port: faker.color.cmyk(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            },
        },
    }
}
function generateAction(): FlowAction {
    return {
        type: FlowActionType.PIECE,
        displayName: faker.hacker.noun(),
        name: apId(),
        skip: false,
        settings: {
            input: {},
            pieceName: faker.helpers.arrayElement(['@activepieces/piece-schedule', '@activepieces/piece-webhook']),
            pieceVersion: faker.system.semver(),
            actionName: faker.hacker.noun(),
            propertySettings: {},
        },
        valid: true,
    }
}

function generateTrigger(): FlowTrigger {
    return {
        type: FlowTriggerType.PIECE,
        displayName: faker.hacker.noun(),
        name: apId(),
        settings: {
            pieceName: faker.helpers.arrayElement(['@activepieces/piece-schedule', '@activepieces/piece-webhook']),
            pieceVersion: faker.system.semver(),
            triggerName: faker.hacker.noun(),
            input: {},
            propertySettings: {},
        },
        valid: true,
    }
}