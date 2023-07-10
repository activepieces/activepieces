import { createAction, Property } from "@activepieces/pieces-framework";
import { notionCommon } from "../common";
import { Client } from "@notionhq/client";

export default createAction({
    name: 'create_database_item',
    displayName: 'Create Database Item',
    description: 'Adds an item to a database',
    props: {
        authentication: notionCommon.authentication,
        database_id: notionCommon.database_id,
        content: Property.ShortText({
            displayName: 'Content',
            description: 'The content of the row to create',
            required: true
        })
    },
    async run(context) {
        const databaseId = context.propsValue.database_id;
        if (!databaseId) {
            throw new Error('Database ID is required');
        }

        const notion = new Client({
            auth: context.propsValue.authentication.access_token,
            notionVersion: "2022-02-22",
        });

        const response = await notion.pages.create({

            parent: {
                database_id: databaseId
            },
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