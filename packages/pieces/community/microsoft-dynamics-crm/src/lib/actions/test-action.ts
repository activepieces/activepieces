import { microsoftDynamicsCRMAuth } from "../..";
import { createAction } from "@activepieces/pieces-framework";

export const testAction = createAction({
    name: 'test_Action',
    displayName: 'Test Action',
    description: 'Test Action',
    auth: microsoftDynamicsCRMAuth,
    props: {},
    async run(context) {
        console.log("INSIDE RUN");
        console.log(context);
    }
})