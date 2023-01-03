import {CollectionId} from "../../collections/collection";

export interface CreateFlowRequest{
    displayName: string;
    collectionId: CollectionId;
}

export const CreateFlowRequestSchema = {
    body: {
        type: 'object',
        properties: {
            displayName: {type: 'string'},
            collectionId: {type: 'string'}
        },
        required: ['displayName', 'collectionId']
    }
}