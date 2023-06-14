import { Property, createAction } from "@activepieces/pieces-framework";
import { AuthenticationType, getAccessTokenOrThrow, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { linkedinCommon } from "../common";

export const createShareUpdate = createAction({
    name: "create_share_update",
    displayName: "Create Share Update",
    description: 'Create a share update on LinkedIn',
    sampleData: {},
    props: {
        authentication: linkedinCommon.authentication,
    },

    run: async (context) => {
        //
        console.log(context.propsValue.authentication);
    }
})