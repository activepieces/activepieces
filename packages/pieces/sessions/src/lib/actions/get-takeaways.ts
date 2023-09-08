import { sessionCommon } from "../common/common";
import { sessionAuth } from "../..";
import { HttpMethod, httpClient, HttpRequest } from "@activepieces/pieces-common";
import { createAction } from "@activepieces/pieces-framework";

export const getTakeaways = createAction({
    auth: sessionAuth,
    name: "get_takeaways",
    displayName: "Get Takeaway",
    description: "Get the Takeaway for the session.",
    props: {
        session_id: sessionCommon.session_id,
    },
    async run({propsValue, auth}) {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${sessionCommon.baseUrl}sessions/${propsValue['session_id']}/takeaways`,
            headers: {
                "accept":"application/json",
                "x-api-key":auth,
            }
        }
        return await httpClient.sendRequest(request);
    }
})