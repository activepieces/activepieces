import { Cursor } from "../../common/seek-page";
import { ProjectId } from "../../project/project";

export interface ListAppRequest {
    projectId: ProjectId;
    limit: number;
    cursor: Cursor;
}

export const ListAppRequest = {
    querystring: {
        type: 'object',
        properties: {
            limit: { type: 'number' },
            projectId: { type: 'string' },
            cursor: { type: 'string' },
        },
        required: ['projectId']
    }
}