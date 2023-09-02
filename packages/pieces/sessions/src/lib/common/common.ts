import { Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";

export const sessionCommon = {
    baseUrl: "https://api.app.sessions.us/api/",
    booking_id: Property.Dropdown({
        displayName: "Booking Page",
        required: true,
        refreshers: ['auth'],
        options: async({auth}) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please authenticate first"
                }
            }
            const bookings = (await httpClient.sendRequest<{pages: {id: string, name: string}[] }>({
                method: HttpMethod.GET,
                url: "https://api.app.sessions.us/api/bookings",
                headers: {
                    "accept":"application/json",
                    "x-api-key": `${auth}`
                }
            })).body.pages;

            return {
                disabled: false,
                options: bookings.map((page: {id: string, name: string}) => {
                    return {
                        label: page.name,
                        value: page.id
                    }
                })
            };
        }
    })
}