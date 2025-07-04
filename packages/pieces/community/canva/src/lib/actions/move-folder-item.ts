import { Property, createAction } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL } from '../common/client';
import { canvaAuth } from '../common/auth';

export const moveFolderItemAction = createAction({
    auth: canvaAuth,
    name: 'move_folder_item',
    displayName: 'Move Folder Item',
    description: 'Move an item from one folder to another in Canva.',
    props: {
        toFolderId: Property.ShortText({
            displayName: 'Destination Folder ID',
            description: 'ID of the folder where you want to move the item. Use `root` to move the item to the top level.',
            required: true,
        }),
        itemId: Property.ShortText({
            displayName: 'Item ID',
            description: 'The ID of the item you want to move.',
            required: true,
        }),
    },
    async run(context) {
        const { toFolderId, itemId } = context.propsValue;

        const body = {
            to_folder_id: toFolderId,
            item_id: itemId,
        };

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${BASE_URL}/rest/v1/folders/move`,
            body,
            headers: {
                'Content-Type': 'application/json',
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth.access_token,
            }
        });

        if (response.status === 204) {
            return { success: true, message: 'Item moved successfully.' };
        } else {
            return { success: false, message: 'Failed to move item.', status: response.status, data: response.body };
        }
    },
});
