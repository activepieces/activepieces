import { hubspotAuth } from "../../";
import { createAction } from "@activepieces/pieces-framework";
import {Client } from "@hubspot/api-client";

export const uploadFileAction = createAction({
    auth:hubspotAuth,
    name:"upload-file",
    displayName:"Upload File",
    description:"Uploads a file to HubSpot File Manager.",
    props:{
       
    },
    async run(context){
        const client = new Client({ accessToken: context.auth.access_token });

        const response = await client.files.filesApi.upload()
    }
})