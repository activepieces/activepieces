import { AppSecretId } from "../../app-secret/app-secret";
import { Cursor } from "../../common/seek-page";

export interface ListAppConnectionRequest {
    appSecretId: AppSecretId;
    limit: number;
    cursor: Cursor;
}

export const ListAppConnectionRequest = {
    querystring: {
        type: 'object',
        properties: {
            limit: { type: 'number' },
            appSecretId: { type: 'string' },
            cursor: { type: 'string' },
        },
        required: ['appSecretId']
    }
}