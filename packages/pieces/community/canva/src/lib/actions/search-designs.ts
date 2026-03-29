import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { canvaAuth } from "../auth";

export const searchDesignsAction = createAction({
    auth: canvaAuth,
    name: "search_designs",
    displayName: "Search Designs",
    description: "Search the metadata of all the designs in a Canva user's projects",
    props: {
        query: Property.ShortText({
            displayName: "Search Query",
            required: true,
        }),
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
        }),
        limit: Property.Number({
            displayName: "Limit",
            description: "Number of items to return (1-100)",
            required: false,
            defaultValue: 10
        })
    },
    async run(context) {
        const { query, ownership, sort_by, continuation, limit } = context.propsValue;
        const queryParams: Record<string, string> = {};
        queryParams['query'] = query;
        if (ownership) queryParams['ownership'] = ownership;
        if (sort_by) queryParams['sort_by'] = sort_by;
        if (continuation) queryParams['continuation'] = continuation;
        if (limit !== undefined && limit !== null) queryParams['limit'] = limit.toString();

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
