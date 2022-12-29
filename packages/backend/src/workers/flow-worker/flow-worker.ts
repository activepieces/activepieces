import fs from "node:fs";
import {
  Action,
  ActionType,
  apId,
  CodeActionSettings,
  CollectionId,
  CollectionVersion,
  CollectionVersionId,
  ExecutionOutput,
  File,
  FlowId,
  FlowRun,
  FlowRunId,
  FlowVersion,
  FlowVersionId,
  Instance,
  InstanceId,
  PrincipalType,
  Trigger,
} from "shared";
import { Sandbox, sandboxManager } from "../sandbox";
import { flowVersionService } from "../../flows/flow-version/flow-version.service";
import { collectionVersionService } from "../../collections/collection-version/collection-version.service";
import { redisLock } from "../../database/redis-connection";
import { fileService } from "../../file/file.service";
import { codeBuilder } from "../code-worker/code-builder";
import { tokenUtils } from "../../authentication/lib/token-utils";
import { collectionService } from "../../collections/collection.service";
import { flowRunService } from "../../flow-run/flow-run-service";

export interface ExecutionRequest {
  runId: FlowRunId;
  instanceId: InstanceId | null;
  flowVersionId: FlowVersionId;
  collectionVersionId: CollectionVersionId;
  payload: unknown;
}

async function executeFlow(request: ExecutionRequest) {
  const flowVersion = (await flowVersionService.getOne(request.flowVersionId))!;
  const collectionVersion = (await collectionVersionService.getOne(request.collectionVersionId))!;

  const sandbox = sandboxManager.obtainSandbox();
  const flowLock = await redisLock(flowVersion.id);
  console.log("Executing flow " + flowVersion.id + " and run Id " + request.runId + " in sandbox " + sandbox.boxId);
  try {
    sandbox.cleanAndInit();

    await downloadFiles(sandbox, flowVersion, collectionVersion, request.payload);

    sandbox.runCommandLine("/usr/bin/node activepieces-engine.js execute-flow");
    const executionOutput: ExecutionOutput = JSON.parse(
      fs.readFileSync(sandbox.getSandboxFilePath("output.json")).toString()
    );
    const logsFile = await fileService.save(Buffer.from(JSON.stringify(executionOutput)));
    await flowRunService.finish(request.runId, executionOutput.status, logsFile.id);
  } finally {
    sandboxManager.returnSandbox(sandbox.boxId);
    await flowLock();
  }
  console.log(
    "Finished executing flow " + flowVersion + " and run Id " + request.runId + " in sandbox " + sandbox.boxId
  );
}

async function downloadFiles(
  sandbox: Sandbox,
  flowVersion: FlowVersion,
  collectionVersion: CollectionVersion,
  payload: unknown
) {
  const buildPath = sandbox.getSandboxFolderPath();

  fs.mkdirSync(buildPath + "/flows/");
  fs.writeFileSync(buildPath + "/flows/" + flowVersion.id + ".json", JSON.stringify(flowVersion));

  fs.mkdirSync(buildPath + "/collections/");
  fs.writeFileSync(buildPath + "/collections/" + collectionVersion.id + ".json", JSON.stringify(collectionVersion));

  fs.mkdirSync(buildPath + "/codes/");
  const artifacts: File[] = await buildCodes(flowVersion);
  artifacts.forEach((artifact) => {
    fs.writeFileSync(buildPath + "/codes/" + artifact.id + ".js", artifact.data);
  });
  fs.writeFileSync(buildPath + "/activepieces-engine.js", fs.readFileSync("resources/activepieces-engine.js"));
  fs.writeFileSync(
    buildPath + "/input.json",
    await constructInputString(flowVersion.id, collectionVersion.collectionId, collectionVersion.id, payload)
  );
}

async function constructInputString(
  flowVersionId: FlowVersionId,
  collectionId: CollectionId,
  collectionVersionId: CollectionVersionId,
  payload: unknown
): Promise<string> {
  return JSON.stringify({
    flowVersionId,
    collectionVersionId,
    workerToken: tokenUtils.encode({
      id: apId(),
      type: PrincipalType.WORKER,
      collectionId,
    }),
    apiUrl: "http://localhost:3000",
    triggerPayload: payload,
  });
}

async function buildCodes(flowVersion: FlowVersion) {
  const buildRequests: Array<Promise<File>> = [];
  let currentStep: Trigger | Action | undefined = flowVersion.trigger;
  while (currentStep !== undefined) {
    if (currentStep.type === ActionType.CODE) {
      const codeActionSettings: CodeActionSettings = currentStep.settings;
      buildRequests.push(
        new Promise<File>(async (resolve, reject) => {
          if (codeActionSettings.artifactPackagedId === undefined) {
            const sourceId = codeActionSettings.artifactSourceId;
            const fileEntity = await fileService.getOne(sourceId);
            const builtFile = await codeBuilder.build(fileEntity!.data);
            const savedPackagedFile: File = await fileService.save(builtFile);
            codeActionSettings.artifactPackagedId = savedPackagedFile.id;
            resolve(savedPackagedFile);
          } else {
            const file: File = (await fileService.getOne(codeActionSettings.artifactPackagedId))!;
            resolve(file);
          }
        })
      );
    }
    currentStep = currentStep.nextAction;
  }
  const files: File[] = await Promise.all(buildRequests);
  if (files.length > 0) {
    await flowVersionService.overwriteVersion(flowVersion.id, flowVersion);
  }
  return files;
}

export const flowWorker = {
  async executeInstance(instance: Instance, flowId: FlowId, payload: undefined) {
    const flowVersionId: FlowVersionId = instance.flowIdToVersionId[flowId];
    const request: ExecutionRequest = {
      runId: apId(),
      instanceId: instance.id,
      flowVersionId,
      collectionVersionId: instance.collectionVersionId,
      payload,
    };
    const FlowRun = await createRun(request);
    // TODO THIS IS ASYNC, WE SHOULD JUST ADD IT TO QUEUE
    executeFlow(request);
    return FlowRun;
  },
  async executeTest(
    collectionVersionId: CollectionVersionId,
    flowVersionId: FlowVersionId,
    payload: unknown
  ): Promise<FlowRun> {
    const request: ExecutionRequest = {
      runId: apId(),
      instanceId: null,
      flowVersionId,
      collectionVersionId,
      payload,
    };
    const FlowRun = await createRun(request);
    // TODO THIS IS ASYNC, WE SHOULD JUST ADD IT TO QUEUE
    executeFlow(request);
    return FlowRun;
  },
};

// TODO NEED TO BE OPTIMIZED SINCE WE ARE FETCHING THESE INFO FROM DATABASE TWICE
async function createRun(request: ExecutionRequest): Promise<FlowRun> {
  const collectionVersion = (await collectionVersionService.getOne(request.collectionVersionId))!;
  const collection = (await collectionService.getOne(collectionVersion.collectionId, null))!;
  const flowVersion = (await flowVersionService.getOne(request.flowVersionId))!;
  return await flowRunService.start(
    request.runId,
    request.instanceId,
    collection.projectId,
    flowVersion,
    collectionVersion
  );
}
