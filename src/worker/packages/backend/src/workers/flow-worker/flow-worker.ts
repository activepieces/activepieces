import {
    Action,
    ActionType, apId, CodeActionSettings,
    CollectionId,
    CollectionVersion,
    CollectionVersionId,
    ExecutionOutput,
    File,
    FlowId,
    FlowVersion,
    FlowVersionId,
    Instance,
    InstanceRun,
    InstanceRunId,
    PrincipalType,
    Trigger
} from "shared";
import {InstanceId} from "shared";
import {Sandbox, sandboxManager} from "../sandbox";
import {flowVersionService} from "../../flows/flow-version/flow-version.service";
import {collectionVersionService} from "../../collections/collection-version/collection-version.service";
import {redisLock} from "../../database/redis-connection";
import {fileService} from "../../file/file.service";
import {codeBuilder} from "../code-worker/code-builder";
import { tokenUtils } from "../../authentication/lib/token-utils";
import { collectionService } from "../../collections/collection.service";
import { instanceRunService } from "../../instance-run/instance-run-service";

const fs = require("fs");

export interface ExecutionRequest {
    runId: InstanceRunId,
    instanceId: InstanceId | null;
    flowVersionId: FlowVersionId;
    collectionVersionId: CollectionVersionId;
    payload: unknown
}

async function executeFlow(request: ExecutionRequest) {
    const flowVersion = (await flowVersionService.getOne(request.flowVersionId))!;
    const collectionVersion = (await collectionVersionService.getOne(request.collectionVersionId))!;
    const collection = (await collectionService.getOne(collectionVersion.collectionId, null))!;

    const instanceRun = await instanceRunService.start(request.instanceId, collection.projectId, flowVersion, collectionVersion);
     
    let sandbox = sandboxManager.obtainSandbox();
    let flowLock = await redisLock(flowVersion.id);
    console.log("Executing flow " + flowVersion.id + " and run Id " + instanceRun.id +" in sandbox " + sandbox.boxId);
    try {
        sandbox.cleanAndInit();
 
        await downloadFiles(sandbox, flowVersion, collectionVersion, request.payload);

        sandbox.runCommandLine("/usr/bin/node activepieces-engine.js execute-flow");
        const executionOutput: ExecutionOutput = JSON.parse(fs.readFileSync(sandbox.getSandboxFilePath("output.json").toString()));
        console.log(JSON.stringify(executionOutput));
        const logsFile = await fileService.save(Buffer.from(JSON.stringify(executionOutput)));
        await instanceRunService.finish(instanceRun.id, executionOutput.status, logsFile.id);
    } finally {
        sandboxManager.returnSandbox(sandbox.boxId);
        await flowLock();
    } 
    console.log("Finished executing flow " + flowVersion + " and run Id " + instanceRun.id + " in sandbox " + sandbox.boxId);

}

async function downloadFiles(sandbox: Sandbox, flowVersion: FlowVersion,
                             collectionVersion: CollectionVersion, payload: unknown){
    let buildPath = sandbox.getSandboxFolderPath();

    fs.mkdirSync(buildPath + "/flows/");
    fs.writeFileSync(buildPath + "/flows/" + flowVersion.id + ".json", JSON.stringify(flowVersion));
    
    fs.mkdirSync(buildPath + "/collections/");
    fs.writeFileSync(buildPath + "/collections/" + collectionVersion.id + ".json", JSON.stringify(collectionVersion));
    
    fs.mkdirSync(buildPath + "/codes/");
    let artifacts: File[] = await buildCodes(flowVersion);
    for (let i = 0; i < artifacts.length; ++i) {
        fs.writeFileSync(buildPath + "/codes/" + artifacts[i].id + ".js", artifacts[i].data);
    }
    
    fs.writeFileSync(buildPath + "/activepieces-engine.js", fs.readFileSync("resources/activepieces-engine.js"));
    fs.writeFileSync(buildPath + "/input.json", await constructInputString(flowVersion.id,  collectionVersion.collectionId, collectionVersion.id, payload));

}

async function constructInputString(flowVersionId: FlowVersionId,
     collectionId: CollectionId,
     collectionVersionId: CollectionVersionId,
     payload: unknown) : Promise<string> {
    return JSON.stringify({
        flowVersionId: flowVersionId,
        collectionVersionId: collectionVersionId,
        workerToken: tokenUtils.encode({
            id: apId(),
            type: PrincipalType.WORKER,
            collectionId: collectionId
        }),
        apiUrl: "http://localhost:3000",
        triggerPayload: payload
    });
}

async function buildCodes(flowVersion: FlowVersion) {
    let buildRequests: Promise<File>[] = [];
    let currentStep: Trigger | Action | undefined = flowVersion.trigger;
    while (currentStep !== undefined) {
        if (currentStep.type === ActionType.CODE) {
            let codeActionSettings: CodeActionSettings = currentStep.settings;
            buildRequests.push(new Promise<File>(async (resolve, reject) => {
                if (codeActionSettings.artifactPackagedId === undefined) {
                    let sourceId = codeActionSettings.artifactSourceId;
                    let fileEntity = await fileService.getOne(sourceId);
                    let builtFile = await codeBuilder.build(fileEntity!.data);
                    let savedPackagedFile: File = await fileService.save(builtFile);
                    codeActionSettings.artifactPackagedId = savedPackagedFile.id;
                    resolve(savedPackagedFile);
                } else {
                    let file: File = (await fileService.getOne(codeActionSettings.artifactPackagedId))!;
                    resolve(file);
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
        let flowVersionId: FlowVersionId = instance.flowIdToVersionId[flowId];
        return executeFlow({
            runId: apId(),
            instanceId: instance.id,
            flowVersionId: flowVersionId,
            collectionVersionId:  instance.collectionVersionId, 
            payload: payload
        });
    },
    async executeTest(collectionVersionId: CollectionVersionId, flowVersionId: FlowVersionId, payload: unknown) {
        return executeFlow({
            runId: apId(),
            instanceId: null,
            flowVersionId: flowVersionId,
            collectionVersionId: collectionVersionId, 
            payload: payload
        });
    },
}