import { pipedriveAuth } from "../../index";
import { createAction, Property } from "@activepieces/pieces-framework";
import { pipedriveApiCall } from "../common";
import { HttpMethod } from "@activepieces/pieces-common";

export const getNoteAction = createAction({
    auth: pipedriveAuth,
    name: 'get-note',
    displayName: 'Retrieve a Note',
    description: 'Finds a note by ID using Pipedrive API v2.', 
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
                resourceUri: `/v1/notes/${context.propsValue.noteId}`, 
            });
            return response;
        }
        catch (error) {
            
            console.error("Failed to retrieve note:", error);
            return {
                success: false,
                
            }
        }
    }
})
