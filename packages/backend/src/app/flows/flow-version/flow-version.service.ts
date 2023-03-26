import { TSchema, Type } from "@sinclair/typebox";
import { TypeCompiler } from '@sinclair/typebox/compiler';
import { PieceProperty } from "@activepieces/framework";
import {
    ActionType,
    apId,
    BranchActionSettingsWithValidation,
    CloneFlowVersionRequest,
    CodeActionSettings,
    flowHelper,
    FlowId,
    FlowOperationRequest,
    FlowOperationType,
    FlowVersion,
    FlowVersionId,
    FlowVersionState,
    LoopOnItemsActionSettingsWithValidation,
    PieceActionSettings,
    PieceTriggerSettings,
    ProjectId,
    PropertyType,
    TriggerType,
} from "@activepieces/shared";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { fileService } from "../../file/file.service";
import { ActivepiecesError, ErrorCode } from "@activepieces/shared";
import { flowVersionRepo } from "./flow-version-repo";
import { getPiece } from "@activepieces/pieces-apps";

const branchSetttingsValidaotr = TypeCompiler.Compile(BranchActionSettingsWithValidation);
const loopSettingsValidator = TypeCompiler.Compile(LoopOnItemsActionSettingsWithValidation);

export const flowVersionService = {
    async overwriteVersion(flowVersionId: FlowVersionId, mutatedFlowVersion: FlowVersion) {
        await flowVersionRepo.update(flowVersionId, mutatedFlowVersion as QueryDeepPartialEntity<FlowVersion>);
        return await flowVersionRepo.findOneBy({
            id: flowVersionId,
        });
    },
    async applyOperation(projectId: ProjectId, flowVersion: FlowVersion, operation: FlowOperationRequest): Promise<FlowVersion | null> {
        const mutatedFlowVersion = await applySingleOperation(projectId, flowVersion, operation);
        await flowVersionRepo.update(flowVersion.id, mutatedFlowVersion);
        return await flowVersionRepo.findOneBy({
            id: flowVersion.id,
        });
    },

    async getOne(id: FlowVersionId): Promise<FlowVersion | null> {
        if(id === null || id === undefined){
            return null;
        }
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
    async getFlowVersion(projectId: ProjectId, flowId: FlowId, versionId: FlowVersionId | undefined, includeArtifacts: boolean): Promise<FlowVersion | null> {
        const flowVersion = await flowVersionRepo.findOne({
            where: {
                flowId,
                id: versionId,
            },
            order: {
                created: "DESC",
            },
        });
        if (includeArtifacts) {
            return await addArtifactsAsBase64(projectId, flowVersion);
        }
        return flowVersion;
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

async function applySingleOperation(projectId: ProjectId, flowVersion: FlowVersion, request: FlowOperationRequest): Promise<FlowVersion> {
    request = await prepareRequest(projectId, flowVersion, request);
    return flowHelper.apply(flowVersion, request);
}

async function addArtifactsAsBase64(projectId: ProjectId, flowVersion: FlowVersion | null) {
    if (flowVersion === null) {
        return null;
    }
    const flowVersionWithArtifacts: FlowVersion = JSON.parse(JSON.stringify(flowVersion));
    const artifactPromises = [];

    const steps = flowHelper.getAllSteps(flowVersionWithArtifacts);
    for (const step of steps) {
        if (step.type === ActionType.CODE) {
            const codeSettings: CodeActionSettings = step.settings;
            const artifactPromise = fileService
                .getOne({ projectId: projectId, fileId: codeSettings.artifactSourceId })
                .then((artifact) => {
                    if (artifact !== null) {
                        codeSettings.artifactSourceId = undefined;
                        codeSettings.artifact = artifact.data.toString('base64');
                    }
                });
            artifactPromises.push(artifactPromise);
        }
    }

    await Promise.all(artifactPromises);
    return flowVersionWithArtifacts;
}

async function prepareRequest(projectId: ProjectId, flowVersion: FlowVersion, request: FlowOperationRequest) {
    const clonedRequest: FlowOperationRequest = JSON.parse(JSON.stringify(request));
    switch (clonedRequest.type) {
    case FlowOperationType.ADD_ACTION:
        clonedRequest.request.action.valid = true;
        if(clonedRequest.request.action.type === ActionType.LOOP_ON_ITEMS) {
            clonedRequest.request.action.valid = loopSettingsValidator.Check(clonedRequest.request.action.settings);
        }
        else if(clonedRequest.request.action.type === ActionType.BRANCH) {
            clonedRequest.request.action.valid = branchSetttingsValidaotr.Check(clonedRequest.request.action.settings);
        }
        else if (clonedRequest.request.action.type === ActionType.PIECE) {
            clonedRequest.request.action.valid = validateAction(clonedRequest.request.action.settings);
        }
        else if (clonedRequest.request.action.type === ActionType.CODE) {
            const codeSettings: CodeActionSettings = clonedRequest.request.action.settings;
            await uploadArtifact(projectId, codeSettings);
        }
        break;
    case FlowOperationType.UPDATE_ACTION:
        clonedRequest.request.valid = true;
        if(clonedRequest.request.type === ActionType.LOOP_ON_ITEMS) {
            clonedRequest.request.valid = loopSettingsValidator.Check(clonedRequest.request.settings);
        }
        else if(clonedRequest.request.type === ActionType.BRANCH) {
            clonedRequest.request.valid = branchSetttingsValidaotr.Check(clonedRequest.request.settings);
        }
        else if (clonedRequest.request.type === ActionType.PIECE) {
            clonedRequest.request.valid = validateAction(clonedRequest.request.settings);
        }
        else if (clonedRequest.request.type === ActionType.CODE) {
            const codeSettings: CodeActionSettings = clonedRequest.request.settings;
            await uploadArtifact(projectId, codeSettings);
            const previousStep = flowHelper.getStep(flowVersion, clonedRequest.request.name);
            if (
                previousStep !== undefined &&
                    previousStep.type === ActionType.CODE &&
                    codeSettings.artifactSourceId !== previousStep.settings.artifactSourceId
            ) {
                await deleteArtifact(projectId, previousStep.settings);
            }
        }
        break;
    case FlowOperationType.DELETE_ACTION: {
        const previousStep = flowHelper.getStep(flowVersion, clonedRequest.request.name);
        if (previousStep !== undefined && previousStep.type === ActionType.CODE) {
            await deleteArtifact(projectId, previousStep.settings);
        }
        break;
    }

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
    if (
        settings.pieceName === undefined ||
        settings.pieceVersion === undefined ||
        settings.actionName === undefined ||
        settings.input === undefined
    ) {
        return false;
    }
    const piece = getPiece(settings.pieceName);
    if (piece === undefined) {
        return false;
    }
    const action = piece.getAction(settings.actionName);
    if (action === undefined) {
        return false;
    }
    return validateProps(action.props, settings.input);
}

function validateTrigger(settings: PieceTriggerSettings) {
    if (
        settings.pieceName === undefined ||
        settings.pieceVersion === undefined ||
        settings.triggerName === undefined ||
        settings.input === undefined
    ) {
        return false;
    }
    const piece = getPiece(settings.pieceName);
    if (piece === undefined) {
        return false;
    }
    const trigger = piece.getTrigger(settings.triggerName);
    if (trigger === undefined) {
        return false;
    }
    return validateProps(trigger.props, settings.input);
}

function validateProps(props: PieceProperty, input: Record<string, unknown>) {
    const propsSchema = buildSchema(props);
    const propsValidator = TypeCompiler.Compile(propsSchema);
    return propsValidator.Check(input);
}

function buildSchema(props: PieceProperty): TSchema {
    const entries = Object.entries(props);
    const nonNullableUnknownPropType = Type.Not(Type.Null(),Type.Unknown());
    const propsSchema: Record<string, TSchema> = {};
    for (let i = 0; i < entries.length; ++i) {
        const property = entries[i][1];
        const name: string = entries[i][0];
        switch (property.type) {
        case PropertyType.SHORT_TEXT:
        case PropertyType.LONG_TEXT:
            propsSchema[name] = Type.String({
                minLength: property.required ? 1 : undefined
            });
            break;
        case PropertyType.CHECKBOX:
            propsSchema[name] = Type.Union([Type.Boolean(),Type.String({})]) ;
            break;
        case PropertyType.NUMBER:
            // Because it could be a variable
            propsSchema[name] = Type.String({});
            break;
        case PropertyType.STATIC_DROPDOWN:
            propsSchema[name] =  nonNullableUnknownPropType;
            break;
        case PropertyType.DROPDOWN:
            propsSchema[name] = nonNullableUnknownPropType;
            break;
        case PropertyType.OAUTH2:
            // Only accepts connections variable.
            propsSchema[name] = Type.Union([Type.RegEx(RegExp('[$]{1}{connections.(.*?)}')), Type.String()]);
            break;
        case PropertyType.ARRAY:
            // Only accepts connections variable.
            propsSchema[name] = Type.Union([Type.Array(Type.String({})), Type.String()]);
            break;
        case PropertyType.OBJECT:
            propsSchema[name] = Type.Union([Type.Record(Type.String(), Type.Any()), Type.String()]);
            break;
        case PropertyType.JSON:
            propsSchema[name] = Type.Union([Type.Record(Type.String(), Type.Any()), Type.Array(Type.Any()), Type.String()]);
            break;
        case PropertyType.MULTI_SELECT_DROPDOWN:
            propsSchema[name] = Type.Union([Type.Array(Type.Any()), Type.String()]);
            break;
        case PropertyType.STATIC_MULTI_SELECT_DROPDOWN:
            propsSchema[name] = Type.Union([Type.Array(Type.Any()), Type.String()]);
            break;
        case PropertyType.DYNAMIC:
            propsSchema[name] = Type.Record(Type.String(), Type.Any());
            break;
        }

        if (!property.required) {
            propsSchema[name] = Type.Optional(Type.Union([Type.Null(), Type.Undefined(), propsSchema[name]]));
        }
    }

    return Type.Object(propsSchema);
}

async function deleteArtifact(projectId: ProjectId, codeSettings: CodeActionSettings): Promise<CodeActionSettings> {
    const requests: Array<Promise<void>> = [];
    if (codeSettings.artifactSourceId !== undefined) {
        requests.push(fileService.delete({ projectId: projectId, fileId: codeSettings.artifactSourceId }));
    }
    if (codeSettings.artifactPackagedId !== undefined) {
        requests.push(fileService.delete({ projectId: projectId, fileId: codeSettings.artifactPackagedId }));
    }
    await Promise.all(requests);
    return codeSettings;
}

async function uploadArtifact(projectId: ProjectId, codeSettings: CodeActionSettings): Promise<CodeActionSettings> {
    if (codeSettings.artifact !== undefined) {
        const bufferFromBase64 = Buffer.from(codeSettings.artifact, "base64");
        const savedFile = await fileService.save(projectId, bufferFromBase64);
        codeSettings.artifact = undefined;
        codeSettings.artifactSourceId = savedFile.id;
        codeSettings.artifactPackagedId = undefined;
    }
    return codeSettings;
}
