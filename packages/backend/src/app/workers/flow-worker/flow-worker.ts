import fs from "node:fs/promises";
import {
    ActionType,
    CodeActionSettings,
    ExecutionOutputStatus,
    File,
    flowHelper,
    FlowVersion,
    ProjectId,
    StepOutputStatus,
} from "@activepieces/shared";
import { Sandbox, sandboxManager } from "../sandbox";
import { flowVersionService } from "../../flows/flow-version/flow-version.service";
import { fileService } from "../../file/file.service";
import { codeBuilder } from "../code-worker/code-builder";
import { flowRunService } from "../../flow-run/flow-run-service";
import { OneTimeJobData } from "./job-data";
import { collectionService } from "../../collections/collection.service";
import { engineHelper } from "../../helper/engine-helper";
import { createRedisLock } from "../../database/redis-connection";
import { captureException, logger } from "../../helper/logger";

async function executeFlow(jobData: OneTimeJobData): Promise<void> {
    const flowVersion = await flowVersionService.getOneOrThrow(jobData.flowVersionId);
    const collection = await collectionService.getOneOrThrow({ projectId: jobData.projectId, id: jobData.collectionId });

    const sandbox = sandboxManager.obtainSandbox();
    logger.info(`[${jobData.runId}] Executing flow ${flowVersion.id} in sandbox ${sandbox.boxId}`);
    try {
        await sandbox.cleanAndInit();
        await downloadFiles(sandbox, jobData.projectId, flowVersion);
        const executionOutput = await engineHelper.executeFlow(sandbox, {
            flowVersionId: flowVersion.id,
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
        if (sandbox.timedOut()) {
            await flowRunService.finish(jobData.runId, ExecutionOutputStatus.TIMEOUT, null);
        }
        else {
            logger.error("[" + jobData.runId + "] Error executing flow");
            captureException(e as Error);
            await flowRunService.finish(jobData.runId, ExecutionOutputStatus.INTERNAL_ERROR, null);
        }
    }
    finally {
        sandboxManager.returnSandbox(sandbox.boxId);
    }
    logger.info(`[${jobData.runId}] Finished executing flow ${flowVersion.id} in sandbox ${sandbox.boxId}`);
}

async function downloadFiles(
    sandbox: Sandbox,
    projectId: ProjectId,
    flowVersion: FlowVersion
): Promise<void> {
    const flowLock = await createRedisLock();
    try {
        logger.info(`[${flowVersion.id}] Acquiring flow lock to build codes`);
        await flowLock.acquire(flowVersion.id);

        const buildPath = sandbox.getSandboxFolderPath();

        // This has to be before flows, since it does modify code settings and fill it with packaged file id.
        await fs.mkdir(buildPath + "/codes/");
        const artifacts: File[] = await buildCodes(projectId, flowVersion);

        for(const artifact of artifacts) {
            await fs.writeFile(buildPath + "/codes/" + artifact.id + ".js", artifact.data);
        }
        
        await fs.mkdir(buildPath + "/flows/");
        await fs.writeFile(buildPath + "/flows/" + flowVersion.id + ".json", JSON.stringify(flowVersion));

    }
    finally {
        logger.info(`[${flowVersion.id}] Releasing flow lock`);
        await flowLock.release();
    }

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
