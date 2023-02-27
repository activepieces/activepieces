import fs from "node:fs";
import {
    Action,
    ActionType,
    CodeActionSettings,
    CollectionVersion,
    ExecutionOutputStatus,
    File,
    flowHelper,
    FlowVersion,
    ProjectId,
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
    const flowVersion = await flowVersionService.getOneOrThrow(jobData.flowVersionId);
    const collectionVersion = await collectionVersionService.getOneOrThrow(jobData.collectionVersionId);
    const collection = await collectionService.getOneOrThrow({ projectId: jobData.projectId, id: collectionVersion.collectionId });

    const sandbox = sandboxManager.obtainSandbox();
    const flowLock = await createRedisLock();
    console.log(`[${jobData.runId}] Executing flow ${flowVersion.id} in sandbox ${sandbox.boxId}`);
    try {
        flowLock.acquire(flowVersion.id);
        await sandbox.cleanAndInit();

        console.log("[" + jobData.runId + "] Downloading Files");
        await downloadFiles(sandbox, jobData.projectId, flowVersion, collectionVersion);

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

        const logsFile = await fileService.save(jobData.projectId, Buffer.from(JSON.stringify(executionOutput)));
        await flowRunService.finish(jobData.runId, executionOutput.status, logsFile.id);
    }
    catch (e: unknown) {
        console.error(`[${jobData.runId}] error`, e);
        await flowRunService.finish(jobData.runId, ExecutionOutputStatus.INTERNAL_ERROR, null);
    }
    finally {
        sandboxManager.returnSandbox(sandbox.boxId);
        await flowLock.release();
    }
    console.log(`[${jobData.runId}] Finished executing flow ${flowVersion.id} in sandbox ${sandbox.boxId}`);
}

async function downloadFiles(
    sandbox: Sandbox,
    projectId: ProjectId,
    flowVersion: FlowVersion,
    collectionVersion: CollectionVersion,
): Promise<void> {
    const buildPath = sandbox.getSandboxFolderPath();

    // This has to be before flows, since it does modify code settings and fill it with packaged file id.
    fs.mkdirSync(buildPath + "/codes/");
    const artifacts: File[] = await buildCodes(projectId, flowVersion);
    artifacts.forEach((artifact) => {
        fs.writeFileSync(buildPath + "/codes/" + artifact.id + ".js", artifact.data);
    });

    fs.mkdirSync(buildPath + "/flows/");
    fs.writeFileSync(buildPath + "/flows/" + flowVersion.id + ".json", JSON.stringify(flowVersion));

    fs.mkdirSync(buildPath + "/collections/");
    fs.writeFileSync(buildPath + "/collections/" + collectionVersion.id + ".json", JSON.stringify(collectionVersion));

}


async function buildCodes(projectId: ProjectId, flowVersion: FlowVersion): Promise<File[]> {
    const buildRequests: Array<Promise<File>> = [];
    const steps = flowHelper.getAllSteps(flowVersion);
    steps.forEach((step) => {
        if (step.type === ActionType.CODE) {
            const codeActionSettings: CodeActionSettings = step.settings;
            buildRequests.push(getArtifactFile(projectId, codeActionSettings));
        }
    });
    const files: File[] = await Promise.all(buildRequests);
    if (files.length > 0) {
        await flowVersionService.overwriteVersion(flowVersion.id, flowVersion);
    }
    return files;
}

const getArtifactFile = async (projectId: ProjectId, codeActionSettings: CodeActionSettings): Promise<File> => {
    if (codeActionSettings.artifactPackagedId === undefined) {
        console.log(`Building package for file id ${codeActionSettings.artifactSourceId}`);
        const sourceId = codeActionSettings.artifactSourceId;
        const fileEntity = await fileService.getOne({ projectId: projectId, fileId: sourceId });
        const builtFile = await codeBuilder.build(fileEntity.data);
        const savedPackagedFile: File = await fileService.save(projectId, builtFile);
        codeActionSettings.artifactPackagedId = savedPackagedFile.id;
    }
    const file: File = (await fileService.getOne({ projectId: projectId, fileId: codeActionSettings.artifactPackagedId }));
    return file;
};

export const flowWorker = {
    executeFlow,
};
