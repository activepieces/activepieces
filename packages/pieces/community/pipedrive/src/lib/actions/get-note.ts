import { pipedriveAuth } from "../../index";
import { createAction, Property } from "@activepieces/pieces-framework";
import { pipedriveApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getNoteAction = createAction({
    auth: pipedriveAuth,
    name: 'get-note',
    displayName: 'Retrieve a Note',
    description: 'Finds a note by ID using Pipedrive API v2.', // ✅ Updated description for v2
    props: {
        noteId: Property.Number({
            displayName: 'Note ID',
            required: true
        })
    },
    async run(context) {
        try {
            const response = await pipedriveApiCall({
                accessToken: context.auth.access_token,
                apiDomain: context.auth.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: `/v2/notes/${context.propsValue.noteId}`, // ✅ Updated to v2 endpoint
            });
            return response;
        }
        catch (error) {
            // It's generally good practice to log the actual error for debugging purposes
            console.error("Failed to retrieve note:", error);
            return {
                success: false,
                // Optionally, include a more detailed error message from the API response if available
                // error: error.message || 'Unknown error'
            }
        }
    }
})
