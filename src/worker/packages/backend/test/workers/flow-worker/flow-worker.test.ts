import SandboxManager, {Sandbox} from "../../../src/workers/sandbox";
import {flowVersionService} from "../../../src/flows/flow-version/flow-version.service";
import {
    Action,
    apId,
    CollectionVersion,
    CollectionVersionState,
    FlowVersion,
    FlowVersionState, ScheduleTriggerSettings,
    TriggerType
} from "shared";
import {flowWorker} from "../../../src/workers/flow-worker/flow-worker";
import {collectionVersionService} from "../../../src/collections/collection-version/collection-version.service";

const fs = require("fs");

describe('Flow Worker', () => {

    test('Run flow Successfully', async () => {
        jest
            .spyOn(SandboxManager.prototype, 'obtainSandbox')
            .mockImplementation(() => new Sandbox(5));

        let flowVersion: FlowVersion = {
            id: "R1WN13FX93jRnTwe0CHIL",
            flowId: "gDW30PS484pNMe6eOTbkj",
            displayName: "Flow One",
            trigger: {
                type: TriggerType.SCHEDULE,
                settings: {
                    cronExpression: "* * * * *"
                } as ScheduleTriggerSettings,
                displayName: "Hello",
                name: "hello",
                valid: false,
                nextAction: undefined
            },
            valid: false,
            created: 123,
            updated: 123,
            state: FlowVersionState.LOCKED
        };
        let collectionVersion: CollectionVersion = {
            id: "fkaN13FX93jRnTwe0CHIL",
            collectionId: "rDW3asd484pNMe6eOTbkj",
            displayName: "Collection One",
            configs: [],
            created: 123,
            updated: 123,
            state: CollectionVersionState.LOCKED
        };
        jest
            .spyOn(flowVersionService, 'getOne')
            .mockImplementation(() => new Promise<FlowVersion>(((resolve, reject) => {
                resolve(flowVersion);
            })));
        jest
            .spyOn(collectionVersionService, 'getOne')
            .mockImplementation(() => new Promise<CollectionVersion>(((resolve, reject) => {
                resolve(collectionVersion);
            })));

        await flowWorker.executeTest(collectionVersion.id, flowVersion.id, {})

    });

})