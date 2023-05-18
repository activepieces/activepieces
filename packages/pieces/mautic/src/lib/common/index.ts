import {Property} from "@activepieces/pieces-framework";

const instructions = {
    base_url:'The base URL of your Mautic Instance. \n' +
        'If this `https://mautic.ddev.site/s/dashboard` is your dashboard link \n' +
        'then your base_url should be `https://mautic.ddev.site/`',
    basic_auth_enable_guide: 'Please ensure that Basic Authentication is enabled here: \n' +
        'Settings -> Configuration -> API Settings'

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
            username: Property.ShortText({
                displayName: 'Username',
                description: instructions.basic_auth_enable_guide,
                required: true
            }),
            password: Property.ShortText({
                displayName: 'Password',
                description: instructions.basic_auth_enable_guide,
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

export const appender = {
    CONTACT_NEW:'api/contacts/new',
}
