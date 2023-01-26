import fs from "node:fs";
import {
  Action,
  ActionType,
  CodeActionSettings,
  CollectionVersion,
  ExecutionOutputStatus,
  File,
  FlowVersion,
  StepOutputStatus,
  Trigger,
} from "@activepieces/shared";
import { Sandbox, sandboxManager } from "../sandbox";
import { flowVersionService } from "../../flows/flow-version/flow-version.service";
import { collectionVersionService } from "../../collections/collection-version/collection-version.service";
import { fileService } from "../../file/file.service";
import { codeBuilder } from "../code-worker/code-builder";
import { flowRunService } from "../../flow-run/flow-run-service";
import { OneTimeJobData } from "./job-data";
import { collectionService } from "../../collections/collection.service";
import { engineHelper } from "../../helper/engine-helper";
import { createRedisLock } from "../../database/redis-connection";

async function executeFlow(jobData: OneTimeJobData): Promise<void> {
  const flowVersion = (await flowVersionService.getOne(jobData.flowVersionId))!;
  const collectionVersion = (await collectionVersionService.getOne(jobData.collectionVersionId))!;
  const collection = await collectionService.getOneOrThrow(collectionVersion.collectionId);

  const sandbox = sandboxManager.obtainSandbox();
  const flowLock = await createRedisLock(flowVersion.id);
  console.log(`[${jobData.runId}] Executing flow ${flowVersion.id} in sandbox ${sandbox.boxId}`);
  try {
    await sandbox.cleanAndInit();

    console.log("[" + jobData.runId + "] Downloading Files");
    await downloadFiles(sandbox, flowVersion, collectionVersion);

    const executionOutput = await engineHelper.executeFlow(sandbox, {
      flowVersionId: flowVersion.id,
      collectionVersionId: collectionVersion.id,
      collectionId: collection.id,
      projectId: collection.projectId,
      triggerPayload: {
        duration: 0,
        input: {},
        output: jobData.payload,
        status: StepOutputStatus.SUCCEEDED,
      },
    });

    const logsFile = await fileService.save(Buffer.from(JSON.stringify(executionOutput)));
    await flowRunService.finish(jobData.runId, executionOutput.status, logsFile.id);
  } catch (e: unknown) {
    console.error(`[${jobData.runId}] error`, e);
    await flowRunService.finish(jobData.runId, ExecutionOutputStatus.INTERNAL_ERROR, null);
  } finally {
    sandboxManager.returnSandbox(sandbox.boxId);
    await flowLock.release();
  }
  console.log(`[${jobData.runId}] Finished executing flow ${flowVersion.id} in sandbox ${sandbox.boxId}`);
}

async function downloadFiles(
  sandbox: Sandbox,
  flowVersion: FlowVersion,
  collectionVersion: CollectionVersion,
): Promise<void> {
  const buildPath = sandbox.getSandboxFolderPath();

  // This has to be before flows, since it does modify code settings and fill it with packaged file id.
  fs.mkdirSync(buildPath + "/codes/");
  const artifacts: File[] = await buildCodes(flowVersion);
  artifacts.forEach((artifact) => {
    fs.writeFileSync(buildPath + "/codes/" + artifact.id + ".js", artifact.data);
  });

  fs.mkdirSync(buildPath + "/flows/");
  fs.writeFileSync(buildPath + "/flows/" + flowVersion.id + ".json", JSON.stringify(flowVersion));

  fs.mkdirSync(buildPath + "/collections/");
  fs.writeFileSync(buildPath + "/collections/" + collectionVersion.id + ".json", JSON.stringify(collectionVersion));

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
    console.log(`Building package for file id ${codeActionSettings.artifactSourceId}`);
    const sourceId = codeActionSettings.artifactSourceId!;
    const fileEntity = await fileService.getOne(sourceId);
    const builtFile = await codeBuilder.build(fileEntity!.data);
    const savedPackagedFile: File = await fileService.save(builtFile);
    codeActionSettings.artifactPackagedId = savedPackagedFile.id;
  }
  const file: File = (await fileService.getOne(codeActionSettings.artifactPackagedId))!;
  return file;
};

export const flowWorker = {
  executeFlow,
};
