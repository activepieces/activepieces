import { faker } from '@faker-js/faker'
import { Action, ActionType, apId, FlowStatus, FlowVersion, FlowVersionState, PackageType, PieceType, PopulatedFlow, Trigger, TriggerType } from '@activepieces/shared'


export const flowGenerator = {
    simpleActionAndTrigger(): PopulatedFlow {
        return flowGenerator.randomizeMetadata(flowVersionGenerator.simpleActionAndTrigger())
    },
    randomizeMetadata(version: Omit<FlowVersion, 'flowId'>): PopulatedFlow {
        const flowId = apId()
        const result = {
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
        }
    },
}

function randomizeTriggerMetadata(trigger: Trigger): Trigger {
    return {
        ...trigger,
        settings: {
            ...trigger.settings,
            inputUiInfo: {
                server: faker.internet.url(),
                port: faker.color.cmyk(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            },
        },
    }
}
function generateAction(): Action {
    return {
        type: ActionType.PIECE,
        displayName: faker.hacker.noun(),
        name: apId(),
        settings: {
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
            pieceName: faker.helpers.arrayElement(['@activepieces/piece-schedule', '@activepieces/piece-webhook']),
            pieceVersion: faker.system.semver(),
            actionName: faker.hacker.noun(),
            input: {

            },
            inputUiInfo: {

            },
        },
        valid: true,
    }
}

function generateTrigger(): Trigger {
    return {
        type: TriggerType.PIECE,
        displayName: faker.hacker.noun(),
        name: apId(),
        settings: {
            packageType: PackageType.REGISTRY,
            pieceType: PieceType.OFFICIAL,
            pieceName: faker.helpers.arrayElement(['@activepieces/piece-schedule', '@activepieces/piece-webhook']),
            pieceVersion: faker.system.semver(),
            triggerName: faker.hacker.noun(),
            input: {

            },
            inputUiInfo: {

            },
        },
        valid: true,
    }
}