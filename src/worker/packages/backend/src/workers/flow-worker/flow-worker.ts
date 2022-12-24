import {CollectionVersionId, FlowId, FlowVersionId, Instance} from "shared";
import {InstanceId} from "shared/dist/model/instance";
import {sandboxManager} from "../sandbox";
import {flowVersionService} from "../../flows/flow-version/flow-version.service";
import {collectionVersionService} from "../../collections/collection-version/collection-version.service";

const fs = require("fs");

async function executeFlow(instanceId: InstanceId,
                     flowVersionId: FlowVersionId,
                     collectionVersionId: CollectionVersionId,
                     payload: unknown) {
    let sandbox = sandboxManager.obtainSandbox();
    let buildPath = sandbox.getSandboxFolderPath();
    console.log("Executing flow " + flowVersionId + " in sandbox " + sandbox.boxId);
    try {
        const flowVersion = await flowVersionService.getOne(flowVersionId);
        const collectionVersion = await collectionVersionService.getOne(collectionVersionId);
        sandbox.cleanAndInit();
        fs.mkdirSync(buildPath + "/flows/");
        fs.mkdirSync(buildPath + "/collections/");
        fs.mkdirSync(buildPath + "/codes/");
        // TODO ADD CODES

        fs.writeFileSync(buildPath + "/flows/" + flowVersionId + ".js", JSON.stringify(flowVersion));
        fs.writeFileSync(buildPath + "/collections/" + collectionVersionId + ".js", JSON.stringify(collectionVersion));
        fs.writeFileSync(buildPath + "/activepieces-engine.js", fs.readFileSync("resources/activepieces-engine.js"));
        fs.writeFileSync(buildPath + "/input.json", JSON.stringify({
            flowVersionId: flowVersionId,
            collectionVersionId: collectionVersionId,
            // TODO REPLACE WITH WORKER TOKEN
            workerToken: "TOKEN",
            apiUrl: "",
            triggerPayload: payload
        }))
        sandbox.runCommandLine("/usr/bin/node activepieces-engine.js execute-flow");
    } finally {
        sandboxManager.returnSandbox(sandbox.boxId);
    }
    console.log("Finished executing flow " + flowVersionId + " in sandbox " + sandbox.boxId);
}

export const flowWorker = {
    async executeInstance(instance: Instance, flowId: FlowId, payload: undefined) {
        let flowVersionId: FlowVersionId = instance.flowVersionId[flowId.toString()];
        return executeFlow(instance.id, flowVersionId, instance.collectionVersionId, payload);
    },
    async executeTest( collectionVersionId: CollectionVersionId, flowVersionId: FlowVersionId,payload: unknown) {
        return executeFlow(undefined, flowVersionId, collectionVersionId, payload);
    },
}