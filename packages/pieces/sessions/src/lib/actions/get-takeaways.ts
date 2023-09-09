import { sessionCommon } from "../common/common";
import { sessionAuth } from "../..";
import { HttpMethod, httpClient, HttpRequest } from "@activepieces/pieces-common";
import { Property, createAction } from "@activepieces/pieces-framework";
import dayjs from 'dayjs'

export const getTakeaway = createAction({
    auth: sessionAuth,
    name: "get_takeaway",
    displayName: "Get Takeaway",
    description: "Get the takeaway for the session.",
    props: {
        recent: Property.Checkbox({
            displayName: "Use recent",
            description: "Use the most recent session.",
            required: true,
            defaultValue: false
        }),
        id: sessionCommon.session_id
    },
    async run({auth, store}) {
        const session = await latestSession(auth);
        const id = await store.get<string>('lastId');
        const dateOf = await store.get<string>('createdAt')
        if (!id){
            await store.put("lastSession", session['createdAt']);
            await store.put("lastId", session['id']);
            return "Session Data stored, please rerun";
        }

        if (dayjs(session.createdAt).isBefore(dayjs(dateOf))){
            return "Rerun this step, something went wrong";
        }

        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${sessionCommon.baseUrl}sessions/${session.id}/takeaways`,
            headers: {
                "accept":"application/json",
                "x-api-key":auth,
            }
        }
        await store.put("lastSession", session['createdAt']);
        await store.put("lastId", session['id']);
        return await httpClient.sendRequest(request);
    }
});

async function latestSession(auth: string){
    const sessions = (await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: "https://api.app.sessions.us/api/sessions",
        headers: {
            "accept":"application/json",
            "x-api-key": `${auth}`
        }
    })).body;
    return {
        "id":sessions[0]["id"],
        "createdAt": sessions[0]["createdAt"],
    };
}