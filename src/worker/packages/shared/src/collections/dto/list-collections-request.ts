import {ProjectId} from "../../project/project";
import {Cursor} from "../../common/seek-page";

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