import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { canvaAuth } from "../auth";

export const listFoldersAction = createAction({
    auth: canvaAuth,
    name: "list_folders",
    displayName: "List Folder Items",
    description: "Lists the items in a folder, including other folders, designs, and image assets.",
    props: {
        folderId: Property.ShortText({
            displayName: "Folder ID",
            description: "The ID of the folder to list items from. Use 'root' for the top level of projects or 'uploads' for the Uploads folder.",
            required: true,
            defaultValue: "root",
        }),
        item_types: Property.StaticMultiSelectDropdown({
            displayName: "Item Types",
            required: false,
            options: {
                options: [
                    { label: "Design", value: "design" },
                    { label: "Folder", value: "folder" },
                    { label: "Image", value: "image" },
                ]
            }
        }),
        limit: Property.Number({
            displayName: "Limit",
            required: false,
        }),
        continuation: Property.ShortText({
            displayName: "Continuation Token",
            required: false,
        })
    },
    async run(context) {
        const { folderId, item_types, limit, continuation } = context.propsValue;
        const queryParams: Record<string, string> = {};
        if (item_types && item_types.length > 0) queryParams['item_types'] = item_types.join(',');
        if (limit !== undefined && limit !== null) queryParams['limit'] = limit.toString();
        if (continuation) queryParams['continuation'] = continuation;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.canva.com/rest/v1/folders/${folderId}/items`,
            authentication: {
                type: "bearer",
                token: context.auth.access_token,
            },
            queryParams
        });
        return response.body;
    },
});
