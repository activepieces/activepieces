import { createAction, OAuth2PropertyValue, Property } from "@activepieces/pieces-framework";
import { notionCommon } from "../common";
import { Client } from "@notionhq/client";

export default createAction({
    name: 'find_database_item',
    displayName: 'Find Database Item',
    description: 'Finds an item in the database',
    props: {
        authentication: notionCommon.authentication,
        database_id: notionCommon.database_id,
        content: Property.ShortText({
            displayName: 'Content',
            description: 'The content of the row to find',
            required: true
        })
    },
    async run(context) {
        const databaseId = context.propsValue.database_id;
        if (!databaseId) throw new Error('Database ID is required');
        
        const notion = new Client({
            auth: context.propsValue.authentication.access_token,
            notionVersion: "2022-02-22",
        });

        const response = await notion.databases.query({
            database_id: databaseId,
            filter: {
                property: 'Name',
                title: {
                    contains: context.propsValue.content
                }
            }
        });

        return { response }
    }
})