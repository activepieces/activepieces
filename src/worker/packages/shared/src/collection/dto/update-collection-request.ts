import {Config} from "../config";

export interface UpdateCollectionRequest {
    displayName: string;
    configs: Config[];
}

export const UpdateCollectionSchema = {
    body: {
        type: 'object',
        properties: {
            displayName: {type: 'string'},
        },
        required: ['displayName']
    }
}