import {ProjectId} from "../../model/project";
import {Cursor} from "../../model/seek-page";

export interface ListCollectionsRequest {
    projectId: ProjectId;
    limit: number;
    cursor: Cursor;
}

export const ListCollectionsSchema = {
    querystring: {
        type: 'object',
        properties: {
            limit: {type: 'number'},
            projectId: {type: 'string'},
            cursor: {type: 'string'},
        },
        required: ['projectId']
    }
}