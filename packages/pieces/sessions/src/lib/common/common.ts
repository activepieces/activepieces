import { Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";

interface Pages {
    id: string;
    name: string;
}

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
            const bookings = (await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: "https://api.app.sessions.us/api/booking-pages",
                headers: {
                    "accept":"application/json",
                    "x-api-key": `${auth}`
                }
            })).body;
            const books = [];
            for(let x in bookings){
                books.push(bookings[x] as Pages);
            }

            return {
                disabled: false,
                options: books.map((page: {id: string, name: string}) => {
                    return {
                        label: page.name,
                        value: page.id
                    }
                })
            };
        }
    }),
    session_id: Property.Dropdown({
        displayName: "Session ID",
        required: true,
        refreshers: ['auth', 'recent'],
        options: async({auth, recent}) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Please authenticate first"
                }
            }
            if (recent) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: "Using recent session"
                }
            }
            const sessions = (await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: "https://api.app.sessions.us/api/sessions",
                headers: {
                    "accept":"application/json",
                    "x-api-key": `${auth}`
                }
            })).body;
            const session = [];
            for(let x in sessions){
                session.push(sessions[x] as Pages);
            }

            return {
                disabled: false,
                options: session.map((page: {id: string, name: string}) => {
                    return {
                        label: page.name,
                        value: page.id
                    }
                })
            };
        }
    })
}