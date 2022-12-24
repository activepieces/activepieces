import {Config} from "../config";

export interface UpdateCollectionRequest {
    displayName: string;
    configs: Config[];
}

// TODO ADD VALIDATION FOR CONFIGS
export const UpdateCollectionSchema = {
    body: {
        type: 'object',
        properties: {
            displayName: {type: 'string'},
        },
        required: ['displayName']
    }
}