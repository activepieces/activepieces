import { DynamicPropsValue, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod, HttpRequest } from "@activepieces/pieces-common";

// Function Section
export const mapMauticToActivepiecesProperty = (
    type: string,
    fieldMetadata: {
        displayName: string;
        required: boolean;
    },
    properties: object
) => {
    switch (type) {
        case 'lookup':
        case 'text':
        case 'email':
        case 'tel':
        case 'region':
        case 'country':
        case 'locale':
        case 'timezone':
        case 'url':
            return Property.ShortText(fieldMetadata);
        case 'datetime':
            return Property.DateTime(fieldMetadata);
        case 'number':
            return Property.Number(fieldMetadata);
        case 'boolean':
            return Property.StaticDropdown({
                ...fieldMetadata,
                options: {
                    options: [
                        { value: 'no', label: 'No' },
                        { value: 'yes', label: 'Yes' },
                    ],
                },
            });
        case 'select':
            return Property.StaticDropdown({
                ...fieldMetadata,
                options: {
                    options: Object.values(properties)[0],
                },
            });
        default:
            throw Error(`No support of type ${type}`);
    }
};

export const fetchDynamicFieldsFromMetadata = async (
    baseUrl:string,
    username:string,
    password:string,
    type:"contact"|"company"
)=>{
    const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}api/fields/${type}?limit=1000`,
        headers: {
            'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
            'Content-Type': 'application/json'
        }
    }

    const result = await httpClient.sendRequest(request);
    if(result.status == 200){
        return Object.values(result.body.fields).reduce(
            (fields: DynamicPropsValue, field) => {
                const {
                    label: displayName,
                    alias,
                    type,
                    properties,
                } = field as Record<string, any>;
                const fieldMetadata = {
                    displayName,
                    required: false,
                };
                if (!type) return {};
                fields[alias] = mapMauticToActivepiecesProperty(type, fieldMetadata, properties);
                return fields;
            },
            {}
        );
    }
    throw Error(`Unable to fetch ${type} metadata`);
}


export const getFields = (type:"contact"|"company") => Property.DynamicProperties({
    displayName: 'All Fields',
    description: 'List of all possible fields present',
    required: true,
    refreshers: ['authentication'],
    props: async ({ authentication }) => {
        if (!authentication) return {};
        const { base_url, username, password } = authentication;
        return fetchDynamicFieldsFromMetadata(
            base_url,
            username,
            password,
            type
        );
    },
});

// Constant Section
export const markdownDescription = `
Follow these steps:

1. **Enter the Base URL:** Open your Mautic instance and copy the URL from the address bar. If your dashboard link is "https://mautic.ddev.site/s/dashboard", set your base URL as "https://mautic.ddev.site/".

2. **Enable Basic Authentication:** Log in to Mautic, go to **Settings** > **Configuration** > **API Settings**, and ensure that Basic Authentication is enabled.

`;
