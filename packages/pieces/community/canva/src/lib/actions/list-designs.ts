import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { canvaAuth } from "../auth";

export const listDesignsAction = createAction({
    auth: canvaAuth,
    name: "list_designs",
    displayName: "List Designs",
    description: "Lists metadata for all the designs in a Canva user's projects",
    props: {
        ownership: Property.StaticDropdown({
            displayName: "Ownership",
            required: false,
            options: {
                options: [
                    { label: "Any", value: "any" },
                    { label: "Owned", value: "owned" },
                    { label: "Shared", value: "shared" },
                ]
            },
            defaultValue: "any"
        }),
        sort_by: Property.StaticDropdown({
            displayName: "Sort By",
            required: false,
            options: {
                options: [
                    { label: "Relevance", value: "relevance" },
                    { label: "Modified Descending", value: "modified_descending" },
                    { label: "Modified Ascending", value: "modified_ascending" },
                    { label: "Title Descending", value: "title_descending" },
                    { label: "Title Ascending", value: "title_ascending" },
                ]
            },
            defaultValue: "relevance"
        }),
        continuation: Property.ShortText({
            displayName: "Continuation Token",
            required: false,
        })
    },
    async run(context) {
        const { ownership, sort_by, continuation } = context.propsValue;
        const queryParams: Record<string, string> = {};
        if (ownership) queryParams['ownership'] = ownership;
        if (sort_by) queryParams['sort_by'] = sort_by;
        if (continuation) queryParams['continuation'] = continuation;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: "https://api.canva.com/rest/v1/designs",
            authentication: {
                type: "bearer",
                token: context.auth.access_token,
            },
            queryParams
        });
        return response.body;
    },
});
