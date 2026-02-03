import { createAction, Property, httpClient, HttpMethod } from "@activepieces/pieces-framework";
import { canvaAuth } from "../../index";

export const createDesign = createAction({
    auth: canvaAuth,
    name: "create_design",
    displayName: "Create Design",
    description: "Create a new Canva design",
    props: {
        title: Property.ShortText({
            displayName: "Title",
            required: false,
        }),
        design_type: Property.StaticDropdown({
            displayName: "Design Type",
            required: true,
            options: {
                options: [
                    { label: "Doc", value: "doc" },
                    { label: "Whiteboard", value: "whiteboard" },
                    { label: "Presentation", value: "presentation" },
                    { label: "Video", value: "video" },
                    { label: "Instagram Post", value: "instagram_post" },
                    { label: "Facebook Post", value: "facebook_post" },
                ],
            },
        }),
        asset_id: Property.ShortText({
            displayName: "Asset ID",
            required: false,
        }),
    },
    async run(context) {
        const { title, design_type, asset_id } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: "https://api.canva.com/rest/v1/designs",
            body: {
                design_type: {
                    type: "preset",
                    name: design_type,
                },
                title,
                asset_id,
            },
            authentication: {
                type: context.auth.type,
                token: context.auth.access_token,
            } as any,
        });

        return response.body;
    },
});
