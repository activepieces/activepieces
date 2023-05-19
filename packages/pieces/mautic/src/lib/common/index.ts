import { Property } from '@activepieces/pieces-framework';
import { getFields, markdownDescription } from "./helper";


export const mauticCommon= {
    authentication: Property.CustomAuth({
        displayName: "Authentication",
        description: markdownDescription,
        props: {
            base_url: Property.ShortText({
                displayName: 'Base URL',
                required: true,
            }),
            username: Property.ShortText({
                displayName: 'Username',
                required: true
            }),
            password: Property.ShortText({
                displayName: 'Password',
                required: true
            })
        },
        required: true
    }),
    contactFields: getFields("contact"),
    companyFields: getFields("company"),
    id: Property.ShortText({
        displayName: 'Id of the entity',
        required: true,
    }),
};
