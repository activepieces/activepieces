import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { createDatasource } from "../framework/datasource";


export const websiteDataSource = createDatasource({
    name: 'website',
    description: 'Website',
    auth: PieceAuth.None(),
    props: {
        url: Property.ShortText({
            displayName: 'URL',
            description: 'URL of the website',
            required: true,
        }),
    },
    sync: async ({ propsValue }) => {
        console.log('Syncing website datasource', propsValue);
    }
});