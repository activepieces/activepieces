import { getPiece, PieceProperty } from "pieces";
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
  PieceActionSettings,
  PieceTriggerSettings,
  TriggerType,
} from "shared";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { fileService } from "../../file/file.service";
import { ActivepiecesError, ErrorCode } from "../../helper/activepieces-error";
import { flowVersionRepo } from "./flow-version-repo";

export const flowVersionService = {
  async overwriteVersion(flowVersionId: FlowVersionId, mutatedFlowVersion: FlowVersion) {
    await flowVersionRepo.update(flowVersionId, mutatedFlowVersion as QueryDeepPartialEntity<FlowVersion>);
    return await flowVersionRepo.findOneBy({
      id: flowVersionId,
    });
  },
  async applyOperation(flowVersion: FlowVersion, request: FlowOperationRequest): Promise<FlowVersion | null> {
    request = await prepareRequest(flowVersion, request);
    let mutatedFlowVersion: FlowVersion = flowHelper.apply(flowVersion, request);
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
  async getOneOrThrow(id: FlowVersionId): Promise<FlowVersion> {
    const flowVersion = await flowVersionService.getOne(id);
  
    if (flowVersion === null) {
      throw new ActivepiecesError({
        code: ErrorCode.FLOW_VERSION_NOT_FOUND,
        params: {
          id,
        },
      });
    }
  
    return flowVersion;
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
      clonedRequest.request.action.valid = true;
      if (clonedRequest.request.action.type === ActionType.PIECE) {
        clonedRequest.request.action.valid = validateAction(clonedRequest.request.action.settings);
      } else if (clonedRequest.request.action.type === ActionType.CODE) {
        const codeSettings: CodeActionSettings = clonedRequest.request.action.settings;
        await uploadArtifact(codeSettings);
      }
      break;
    case FlowOperationType.UPDATE_ACTION:
      clonedRequest.request.valid = true;
      if (clonedRequest.request.type === ActionType.PIECE) {
        clonedRequest.request.valid = validateAction(clonedRequest.request.settings);
      } else if (clonedRequest.request.type === ActionType.CODE) {
        const codeSettings: CodeActionSettings = clonedRequest.request.settings;
        await uploadArtifact(codeSettings);
        const previousStep = getStep(flowVersion, clonedRequest.request.name);
        if (
          previousStep !== undefined &&
          previousStep.type === ActionType.CODE &&
          codeSettings.artifactSourceId !== previousStep.settings.artifactSourceId
        ) {
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
    case FlowOperationType.UPDATE_TRIGGER:
      clonedRequest.request.valid = true;
      if (clonedRequest.request.type === TriggerType.PIECE) {
        clonedRequest.request.valid = validateTrigger(clonedRequest.request.settings);
      }
      break;
    default:
      break;
  }
  return clonedRequest;
}

function validateAction(settings: PieceActionSettings) {
  if (settings.pieceName === undefined || settings.actionName === undefined || settings.input === undefined) {
    return false;
  }
  let piece = getPiece(settings.pieceName);
  if (piece === undefined) {
    return false;
  }
  let action = piece.getAction(settings.actionName);
  if (action === undefined) {
    return false;
  }
  return validateProps(action.props, settings.input);
}

function validateTrigger(settings: PieceTriggerSettings) {
  if (settings.pieceName === undefined || settings.triggerName === undefined || settings.input === undefined) {
    return false;
  }
  let piece = getPiece(settings.pieceName);
  if (piece === undefined) {
    return false;
  }
  let trigger = piece.getTrigger(settings.triggerName);
  if (trigger === undefined) {
    return false;
  }
  return validateProps(trigger.props, settings.input);
}

// TODO replace with proper validation, currently it's only validate wether the input is there or not, It should check schema and types as well.
function validateProps(props: Record<string, PieceProperty>, input: Record<string, unknown>) {
  const entries = Object.entries(props);
  for (let i = 0; i < entries.length; ++i) {
    const property: PieceProperty = entries[i][1];
    const name: string = entries[i][0];
    if (property.required && isMissing(input[name])) {
      return false;
    }
  }
  return true;
}

function isMissing(value: any) {
  if (value !== undefined && (typeof value === "string" || value instanceof String) && value.length === 0) {
    return true;
  }
  return value === undefined;
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
