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
  FlowVersion,
  FlowVersionId,
  PrincipalType,
  StepOutput,
  StepOutputStatus,
  Trigger,
} from "shared";
import { Sandbox, sandboxManager } from "../sandbox";
import { flowVersionService } from "../../flows/flow-version/flow-version.service";
import { collectionVersionService } from "../../collections/collection-version/collection-version.service";
import { redisLock } from "../../database/redis-connection";
import { fileService } from "../../file/file.service";
import { codeBuilder } from "../code-worker/code-builder";
import { tokenUtils } from "../../authentication/lib/token-utils";
import { flowRunService } from "../../flow-run/flow-run-service";
import { OneTimeJobData } from "./job-data";

async function executeFlow(jobData: OneTimeJobData): Promise<void> {
  const flowVersion = (await flowVersionService.getOne(jobData.flowVersionId))!;
  const collectionVersion = (await collectionVersionService.getOne(jobData.collectionVersionId))!;

  const sandbox = sandboxManager.obtainSandbox();
  const flowLock = await redisLock(flowVersion.id);
  console.log(`[${jobData.runId}] Executing flow ${flowVersion.id} in sandbox ${sandbox.boxId}`);
  try {
    await sandbox.cleanAndInit();

    console.log("[" + jobData.runId + "] Downloading Files");
    await downloadFiles(sandbox, flowVersion, collectionVersion, jobData.payload);

    console.log("[" + jobData.runId + "] Running Engine");
    await sandbox.runCommandLine("/usr/bin/node activepieces-engine.js execute-flow");

    console.log("[" + jobData.runId + "] Reading Output ");

    const executionOutput: ExecutionOutput = JSON.parse(
      fs.readFileSync(sandbox.getSandboxFilePath("output.json")).toString()
    ) as ExecutionOutput;

    const logsFile = await fileService.save(Buffer.from(JSON.stringify(executionOutput)));
    await flowRunService.finish(jobData.runId, executionOutput.status, logsFile.id);
  } finally {
    sandboxManager.returnSandbox(sandbox.boxId);
    await flowLock();
  }
  console.log(`[${jobData.runId}] Finished executing flow ${flowVersion.id} in sandbox ${sandbox.boxId}`);
}

async function downloadFiles(
  sandbox: Sandbox,
  flowVersion: FlowVersion,
  collectionVersion: CollectionVersion,
  payload: unknown
): Promise<void> {
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
    await constructInputString(flowVersion.id, collectionVersion.collectionId, collectionVersion.id, {
      duration: 0,
      input: {},
      output: payload,
      status: StepOutputStatus.SUCCEEDED,
    })
  );
}

async function constructInputString(
  flowVersionId: FlowVersionId,
  collectionId: CollectionId,
  collectionVersionId: CollectionVersionId,
  payload: StepOutput
): Promise<string> {
  return JSON.stringify({
    flowVersionId,
    collectionVersionId,
    workerToken: await tokenUtils.encode({
      id: apId(),
      type: PrincipalType.WORKER,
      collectionId,
    }),
    apiUrl: "http://localhost:3000",
    triggerPayload: payload,
  });
}

async function buildCodes(flowVersion: FlowVersion): Promise<File[]> {
  const buildRequests: Array<Promise<File>> = [];
  let currentStep: Trigger | Action | undefined = flowVersion.trigger;
  while (currentStep !== undefined) {
    if (currentStep.type === ActionType.CODE) {
      const codeActionSettings: CodeActionSettings = currentStep.settings;
      buildRequests.push(getFile(codeActionSettings));
    }
    currentStep = currentStep.nextAction;
  }
  const files: File[] = await Promise.all(buildRequests);
  if (files.length > 0) {
    await flowVersionService.overwriteVersion(flowVersion.id, flowVersion);
  }
  return files;
}

const getFile = async (codeActionSettings: CodeActionSettings): Promise<File> => {
  if (codeActionSettings.artifactPackagedId === undefined) {
    const sourceId = codeActionSettings.artifactSourceId!;
    const fileEntity = await fileService.getOne(sourceId);
    const builtFile = await codeBuilder.build(fileEntity!.data);
    const savedPackagedFile: File = await fileService.save(builtFile);
    codeActionSettings.artifactPackagedId = savedPackagedFile.id;
    return savedPackagedFile;
  } else {
    const file: File = (await fileService.getOne(codeActionSettings.artifactPackagedId))!;
    return file;
  }
};

export const flowWorker = {
  executeFlow,
};
