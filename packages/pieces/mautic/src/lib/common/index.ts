import {Property} from "@activepieces/pieces-framework";

const instructions = {
    base_url:'The base URL of your Mautic Instance. ' +
        'If this `https://mautic.ddev.site/s/dashboard` is your dashboard link ' +
        'then your base_url should be `https://mautic.ddev.site/`',
    access_token: 'To authorize a request for basic authentication, set an Authorization header.\n' +
        '1. Combine the username and password of a Mautic user with a colon :. ' +
        'For example,if your username is `user` and password is `password` then , user:password.\n' +
        '2. Base64 encode the string from above. You can go to this website `https://www.base64encode.org/.` for the same.  ' +
        'After auth it\'ll look like. dXNlcjpwYXNzd29yZA==.\n' +
        '3. Copy and paste the same.',

}
export const mauticCommon= {
    authentication: Property.CustomAuth({
        displayName: "Authentication",
        description: "Basic Authentication data for Mautic CRM",
        props: {
            base_url: Property.ShortText({
                displayName: 'Base URL',
                description: instructions.base_url,
                required: true,
            }),
            access_token: Property.ShortText({
                displayName: 'Access Token',
                description: instructions.access_token,
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
        displayName: 'Email',
        description: 'Email of the contact',
        required: false,
    }),
    company: Property.ShortText({
        displayName: 'Primary company',
        description: 'Primary company of the contact',
        required: false,
    }),
};

export const appender = {
    CONTACT_NEW:'api/contacts/new',
}
