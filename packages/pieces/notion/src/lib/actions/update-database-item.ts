import { createAction, OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { notionCommon } from "../common";
import { Client } from "@notionhq/client";
import { notionAuth } from "@activepieces/piece-notion";

export default createAction({
    name: 'update_database_item',
    displayName: 'Update Database Item',
    description: 'Updates an item in the database',
    auth: notionAuth,
    requireAuth: true,
    props: {
        database_id: notionCommon.database_id,
        item: Property.Dropdown<string>({
            displayName: 'Item',
            description: 'The item to update',
            required: true,
            refreshers: ["database_id", "authentication"],
            options: async (propsValue) => {
                const databaseId = propsValue['database_id'] as string;
                if (!databaseId) {
                    return {
                        disabled: true,
                        options: []
                    }
                }

                if (!propsValue['authentication']) {
                    return {
                        disabled: true,
                        placeholder: "Please connect your Notion account first",
                        options: []
                    }
                }

                const results = await notionCommon.getItems(propsValue['authentication'] as OAuth2PropertyValue, databaseId);

                const options = results.map((item) => {
                    return {
                        label: item.properties.Name.title[0].text.content,
                        value: item.id
                    }
                });

                return {
                    placeholder: "Select an item",
                    options
                }
            }
        }),
        content: Property.ShortText({
            displayName: 'Content',
            description: 'The content of the row to create',
            required: true
        })
    },
    async run(context) {
        const databaseId = context.propsValue.database_id;
        const itemId = context.propsValue.item;
        if (!databaseId) throw new Error('Database ID is required');
        if (!itemId) throw new Error('Item ID is required');
        
        const notion = new Client({
            auth: context.auth.access_token,
            notionVersion: "2022-02-22",
        });

        const response = await notion.pages.update({
            page_id: itemId,
            properties: {
                title: {
                    title: [
                        {
                            text: {
                                content: context.propsValue.content
                            }
                        }
                    ]
                }
            }
        });

        return { response }
    }
})