import {
    Action,
    ActionType, CodeActionSettings,
    CollectionVersionId,
    File,
    FlowId,
    FlowVersion,
    FlowVersionId,
    Instance,
    Trigger
} from "shared";
import {InstanceId} from "shared";
import {sandboxManager} from "../sandbox";
import {flowVersionService} from "../../flows/flow-version/flow-version.service";
import {collectionVersionService} from "../../collections/collection-version/collection-version.service";
import {redisLock} from "../../database/redis-connection";
import {fileService} from "../../file/file.service";
import {codeBuilder} from "../code-worker/code-builder";

const fs = require("fs");

async function executeFlow(instanceId: InstanceId,
                           flowVersionId: FlowVersionId,
                           collectionVersionId: CollectionVersionId,
                           payload: unknown) {
    const flowVersion = await flowVersionService.getOne(flowVersionId);
    const collectionVersion = await collectionVersionService.getOne(collectionVersionId);
    let sandbox = sandboxManager.obtainSandbox();
    let buildPath = sandbox.getSandboxFolderPath();
    let flowLock = await redisLock(flowVersionId);

    console.log("Executing flow " + flowVersionId + " in sandbox " + sandbox.boxId);
    try {
        sandbox.cleanAndInit();
        fs.mkdirSync(buildPath + "/flows/");
        fs.mkdirSync(buildPath + "/collections/");
        fs.mkdirSync(buildPath + "/codes/");

        let artifacts: File[] = await buildCodes(flowVersion);
        for (let i = 0; i < artifacts.length; ++i) {
            fs.writeFileSync(buildPath + "/codes/" + artifacts[i].id + ".js", artifacts[i].data);
        }
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
        // TODO PARSE THE INPUT AND SAVE THE RUN
    } finally {
        sandboxManager.returnSandbox(sandbox.boxId);
        await flowLock();
    }
    console.log("Finished executing flow " + flowVersionId + " in sandbox " + sandbox.boxId);

}

async function buildCodes(flowVersion: FlowVersion) {
    let buildRequests: Promise<File>[] = [];
    let currentStep: Trigger | Action | undefined = flowVersion.trigger;
    while (currentStep !== undefined) {
        if (currentStep.type === ActionType.CODE) {
            let codeActionSettings: CodeActionSettings = currentStep.settings;
            buildRequests.push(new Promise<File>(async (resolve, reject) => {
                if (codeActionSettings.artifactPackagedId !== undefined) {
                    let sourceId = codeActionSettings.artifactSourceId;
                    let fileEntity = await fileService.getOne(sourceId);
                    let builtFile = await codeBuilder.build(fileEntity.data);
                    let savedPackagedFile: File = await fileService.save(builtFile);
                    codeActionSettings.artifactPackagedId = savedPackagedFile.id;
                    resolve(savedPackagedFile);
                } else {
                    resolve(await fileService.getOne(codeActionSettings.artifactPackagedId));
                }
            }));
        }
        currentStep = currentStep.nextAction;
    }
    let files: File[] = await Promise.all(buildRequests);
    if(files.length > 0) {
        await flowVersionService.overwriteVersion(flowVersion.id, flowVersion);
    }
    return files;
}

export const flowWorker = {
    async executeInstance(instance: Instance, flowId: FlowId, payload: undefined) {
        let flowVersionId: FlowVersionId = instance.flowVersionId[flowId.toString()];
        return executeFlow(instance.id, flowVersionId, instance.collectionVersionId, payload);
    },
    async executeTest(collectionVersionId: CollectionVersionId, flowVersionId: FlowVersionId, payload: unknown) {
        return executeFlow(undefined, flowVersionId, collectionVersionId, payload);
    },
}