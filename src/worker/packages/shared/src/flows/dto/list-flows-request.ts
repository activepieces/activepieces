import {CollectionId} from "../../collections/collection";
import {Cursor} from "../../common/seek-page";

export interface ListFlowsRequest {
    collectionId: CollectionId;
    limit: number;
    cursor: Cursor;
}

export const ListFlowsSchema = {
    querystring: {
        type: 'object',
        properties: {
            limit: {type: 'number'},
            collectionId: {type: 'string'},
            cursor: {type: 'string'},
        },
        required: ['collectionId']
    }
}