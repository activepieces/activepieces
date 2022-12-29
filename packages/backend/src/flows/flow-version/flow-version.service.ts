import {
  ActionType,
  apId,
  CloneFlowVersionRequest,
  CodeActionSettings,
  flowHelper,
  FlowId,
  FlowOperationRequest,
  FlowOperationType,
  FlowVersion,
  FlowVersionId,
  FlowVersionState,
  getStep,
} from "shared";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { fileService } from "../../file/file.service";
import { flowVersionRepo } from "./flow-version-repo";

export const flowVersionService = {
  async overwriteVersion(flowVersionId: FlowVersionId, mutatedFlowVersion: FlowVersion) {
    await flowVersionRepo.update(flowVersionId, mutatedFlowVersion as QueryDeepPartialEntity<FlowVersion>);
    return await flowVersionRepo.findOneBy({
      id: flowVersionId,
    });
  },
  async applyOperation(flowVersion: FlowVersion, request: FlowOperationRequest): Promise<FlowVersion | null> {
    if (request.type === FlowOperationType.UPDATE_ACTION) {
      request = await prepareRequest(flowVersion, request);
    }
    const mutatedFlowVersion: FlowVersion = flowHelper.apply(flowVersion, request);
    await flowVersionRepo.update(flowVersion.id, mutatedFlowVersion as QueryDeepPartialEntity<FlowVersion>);
    return await flowVersionRepo.findOneBy({
      id: flowVersion.id,
    });
  },

  async getOne(id: FlowVersionId): Promise<FlowVersion | null> {
    return await flowVersionRepo.findOneBy({
      id,
    });
  },

  async getFlowVersion(flowId: FlowId, versionId: FlowVersionId | undefined): Promise<FlowVersion | null> {
    return await flowVersionRepo.findOne({
      where: {
        flowId,
        id: versionId,
      },
      order: {
        created: "DESC",
      },
    });
  },

  async createVersion(flowId: FlowId, flowRequest: CloneFlowVersionRequest): Promise<FlowVersion> {
    const flowVersion: Partial<FlowVersion> = {
      id: apId(),
      displayName: flowRequest.displayName,
      flowId,
      trigger: flowRequest.trigger,
      valid: flowRequest.valid,
      state: FlowVersionState.DRAFT,
    };
    return await flowVersionRepo.save(flowVersion);
  },
};

async function prepareRequest(flowVersion: FlowVersion, request: FlowOperationRequest) {
  const clonedRequest: FlowOperationRequest = JSON.parse(JSON.stringify(request));
  switch (clonedRequest.type) {
    case FlowOperationType.ADD_ACTION:
      if (clonedRequest.request.action.type === ActionType.CODE) {
        const codeSettings: CodeActionSettings = clonedRequest.request.action.settings;
        await uploadArtifact(codeSettings);
      }
      break;
    case FlowOperationType.UPDATE_ACTION:
      if (clonedRequest.request.type === ActionType.CODE) {
        const codeSettings: CodeActionSettings = clonedRequest.request.settings;
        await uploadArtifact(codeSettings);
        const previousStep = getStep(flowVersion, clonedRequest.request.name);
        if (previousStep !== undefined && previousStep.type === ActionType.CODE) {
          await deleteArtifact(previousStep.settings);
        }
      }
      break;

    case FlowOperationType.DELETE_ACTION:
      const previousStep = getStep(flowVersion, clonedRequest.request.name);
      if (previousStep !== undefined && previousStep.type === ActionType.CODE) {
        await deleteArtifact(previousStep.settings);
      }
      break;
    default:
      break;
  }
  return clonedRequest;
}

async function deleteArtifact(codeSettings: CodeActionSettings): Promise<CodeActionSettings> {
  const requests: Array<Promise<void>> = [];
  if (codeSettings.artifactSourceId !== undefined) {
    requests.push(fileService.delete(codeSettings.artifactSourceId));
  }
  if (codeSettings.artifactPackagedId !== undefined) {
    requests.push(fileService.delete(codeSettings.artifactPackagedId));
  }
  await Promise.all(requests);
  return codeSettings;
}

async function uploadArtifact(codeSettings: CodeActionSettings): Promise<CodeActionSettings> {
  if (codeSettings.artifact !== undefined) {
    const bufferFromBase64 = Buffer.from(codeSettings.artifact, "base64");
    const savedFile = await fileService.save(bufferFromBase64);
    codeSettings.artifact = undefined;
    codeSettings.artifactSourceId = savedFile.id;
    codeSettings.artifactPackagedId = undefined;
  }
  return codeSettings;
}
