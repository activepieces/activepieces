import { sessionCommon } from "../common/common";
import { sessionAuth } from "../..";
import { HttpMethod, httpClient, HttpRequest } from "@activepieces/pieces-common";
import { createAction } from "@activepieces/pieces-framework";

export const getBook = createAction({
    auth: sessionAuth,
    name: "get_book",
    displayName: "Get Book Page",
    description: "Rectrieve your booking page",
    props: {
        book_id: sessionCommon.booking_id,

    },
    async run({propsValue, auth}) {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${sessionCommon.baseUrl}booking-pages/${propsValue['book_id']}`,
            headers: {
                "accept":"application/json",
                "x-api-key": auth,
            }
        }
        return await httpClient.sendRequest(request);

    }
})