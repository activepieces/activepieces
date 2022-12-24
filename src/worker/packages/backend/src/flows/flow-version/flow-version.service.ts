import {
    ActionType,
    apId,
    CloneFlowVersionRequest,
    CodeActionSettings,
    flowHelper,
    FlowId,
    FlowOperationType,
    FlowVersion,
    FlowVersionId,
    FlowVersionState,
    getStep,
} from "shared";
import {databaseConnection} from "../../database/database-connection";
import {FlowVersionEntity} from "./flow-version-entity";
import {FlowOperationRequest} from "shared/dist/flows/flow-operations";
import {fileService} from "../../file/file.service";

const flowVersionRepo = databaseConnection.getRepository<FlowVersion>(FlowVersionEntity);


export const flowVersionService = {

    async updateVersion(flowVersion: FlowVersion, request: FlowOperationRequest): Promise<FlowVersion> {
        if (request.type === FlowOperationType.UPDATE_ACTION) {
            request = await prepareRequest(flowVersion, request);
        }
        const mutatedFlowVersion = flowHelper.apply(flowVersion, request);
        await flowVersionRepo.update(flowVersion.id, mutatedFlowVersion);
        return flowVersionRepo.findOneBy({
            id: flowVersion.id
        });
    },

    async getOne(id: FlowVersionId) : Promise<FlowVersion>{
        return flowVersionRepo.findOneBy({
            id: id
        })
    },

    async getFlowVersion(flowId: FlowId, versionId: FlowVersionId): Promise<FlowVersion> {
        return flowVersionRepo.findOne({
            where: {
                flowId: flowId,
                id: versionId,
            },
            order: {
                created: 'DESC',
            }
        });
    },

    async createVersion(flowId: FlowId, flowRequest: CloneFlowVersionRequest): Promise<FlowVersion> {
        const flowVersion: Partial<FlowVersion> = {
            id: apId(),
            displayName: flowRequest.displayName,
            flowId: flowId,
            trigger: flowRequest.trigger,
            valid: flowRequest.valid,
            state: FlowVersionState.DRAFT
        }
        return flowVersionRepo.save(flowVersion);
    }

};

async function prepareRequest(flowVersion: FlowVersion, request: FlowOperationRequest) {
    let clonedRequest: FlowOperationRequest = JSON.parse(JSON.stringify(request));
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
                let previousStep = getStep(flowVersion, clonedRequest.request.name);
                if(previousStep.type === ActionType.CODE){
                    await deleteArtifact(previousStep.settings);
                }
            }
            break;

        case FlowOperationType.DELETE_ACTION:
            let previousStep = getStep(flowVersion, clonedRequest.request.name);
            if(previousStep.type === ActionType.CODE){
                await deleteArtifact(previousStep.settings);
            }
            break;
        default:
            break;
    }
    return clonedRequest;
}

async function deleteArtifact(codeSettings: CodeActionSettings): Promise<CodeActionSettings>{
    let requests: Promise<void>[] = [];
    if(codeSettings.artifactSourceId !== undefined) {
        requests.push(fileService.delete(codeSettings.artifactSourceId));
    }
    if(codeSettings.artifactPackagedId !== undefined) {
        requests.push(fileService.delete(codeSettings.artifactPackagedId));
    }
    await Promise.all(requests);
    return codeSettings;
}

async function uploadArtifact(codeSettings: CodeActionSettings): Promise<CodeActionSettings>{
    if(codeSettings.artifact !== undefined) {
        const savedFile = await fileService.save(codeSettings.artifact);
        codeSettings.artifact = undefined;
        codeSettings.artifactSourceId = savedFile.id;
        codeSettings.artifactPackagedId = undefined;
    }
    return codeSettings;
}
