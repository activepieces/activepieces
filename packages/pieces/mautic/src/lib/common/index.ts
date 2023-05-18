import {Property} from "@activepieces/pieces-framework";

const markdownDescription = `
Follow these steps:

1. **Enter the Base URL:** Open your Mautic instance and copy the URL from the address bar. If your dashboard link is "https://mautic.ddev.site/s/dashboard", set your base URL as "https://mautic.ddev.site/".

2. **Enable Basic Authentication:** Log in to Mautic, go to **Settings** > **Configuration** > **API Settings**, and ensure that Basic Authentication is enabled.

`;

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
    firstname: Property.ShortText({
        displayName: 'First Name',
        description: 'First name of the contact',
        required: false,
    }),
    lastname: Property.ShortText({
        displayName: 'Last Name',
        description: 'Last name of the contact',
        required: false,
    }),
    email: Property.ShortText({
        displayName: 'Email',
        description: 'Email of the contact',
        required: false,
    }),
    tags: Property.Array({
        displayName: 'Tags',
        description: 'Tags of the contact',
        required: false,
    }),
    company: Property.ShortText({
        displayName: 'Primary company',
        description: 'Primary company of the contact',
        required: false,
    }),
};

