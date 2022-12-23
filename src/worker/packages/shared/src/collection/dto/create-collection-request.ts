import {ProjectId} from "../../model/project";

export interface CreateCollectionRequest {
    displayName: string;
    projectId: ProjectId
}

export const CreateCollectionSchema = {
    body: {
        type: 'object',
        properties: {
            displayName: {type: 'string'},
            projectId: {type: 'string'}
        },
        required: ['displayName', 'projectId']
    }
}