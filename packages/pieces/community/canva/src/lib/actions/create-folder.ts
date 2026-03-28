import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { canvaAuth } from "../auth";

export const createFolderAction = createAction({
    auth: canvaAuth,
    name: "create_folder",
    displayName: "Create Folder",
    description: "Creates a folder in projects or another folder.",
    props: {
        name: Property.ShortText({
            displayName: "Folder Name",
            required: true,
        }),
        parent_folder_id: Property.ShortText({
            displayName: "Parent Folder ID",
            description: "The folder ID of the parent folder. Use 'root' for the top level of projects or 'uploads' for the Uploads folder.",
            required: false,
            defaultValue: "root",
        }),
    },
    async run(context) {
        const { name, parent_folder_id } = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: "https://api.canva.com/rest/v1/folders",
            headers: {
                "Content-Type": "application/json",
            },
            authentication: {
                type: "bearer",
                token: context.auth.access_token,
            },
            body: {
                name,
                parent_folder_id,
            },
        });
        return response.body;
    },
});
