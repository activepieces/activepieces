import { createAction, Property } from "@activepieces/pieces-framework";
import { notionCommon } from "../common";
import { Client } from "@notionhq/client";
import { notionAuth } from "@activepieces/piece-notion";

export default createAction({
    name: 'create_page',
    displayName: 'Create Page',
    description: 'Creates a page',
    auth: notionAuth,
    requireAuth: true,
    props: {
        parent_page: notionCommon.parent_page,
        title: Property.ShortText({
            displayName: 'Title',
            description: 'The title of the page to create',
            required: true
        }),
        content: Property.ShortText({
            displayName: 'Content',
            description: 'The content of the page to create',
            required: true
        })
    },
    async run(context) {
        const parentPageId = context.propsValue.parent_page;
        const title = context.propsValue.title;
        const content = context.propsValue.content;
        if (!parentPageId) throw new Error('Parent Page ID is required');

        const notion = new Client({
            auth: context.auth.access_token,
            notionVersion: "2022-02-22",
        });

        const response = await notion.pages.create({
            parent: {
                page_id: parentPageId
            },
            properties: {
                title: {
                    title: [
                        {
                            type: "text",
                            text: {
                                content: title
                            }
                        }
                    ]
                },
            },
        });

        return { response }

    }
})