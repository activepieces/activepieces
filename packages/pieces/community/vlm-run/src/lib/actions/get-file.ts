import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { vlmRunAuth } from "../common/auth";
import { makeRequest } from "../common/client";

export const getFileAction = createAction({
    auth: vlmRunAuth,
    name: 'get_file',
    displayName: 'Get File',
    description: "Gets a file's metadata by its ID.",
    props: {
        file_id: Property.ShortText({
            displayName: 'File ID',
            description: 'The unique identifier of the file to retrieve.',
            required: true,
        }),
    },
    async run(context) {
        const { file_id } = context.propsValue;

        const path = `/files/${file_id}`;

        return await makeRequest(
            context.auth,
            HttpMethod.GET,
            path
        );
    },
});