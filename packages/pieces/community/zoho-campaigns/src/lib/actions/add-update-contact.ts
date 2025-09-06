import { createAction, Property, OAuth2PropertyValue, InputPropertyMap } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { zohoCampaignsAuth } from '../..';
import { zohoCampaignsSingleMailingListDropdown } from '../common/props';

export const addUpdateContactAction = createAction({
    auth: zohoCampaignsAuth,
    name: 'add_update_contact',
    displayName: 'Add or Update Contact',
    description: 'Add a new contact to a mailing list, or update them if they already exist.',
    props: {
        email: Property.ShortText({
            displayName: 'Contact Email',
            description: 'The email address of the contact to add or update.',
            required: true,
        }),
        list_choice: Property.StaticDropdown({
            displayName: 'Choose List Method',
            description: 'Add to an existing mailing list or create a new one.',
            required: true,
            defaultValue: 'existing',
            options: {
                options: [
                    { label: 'Add to Existing List', value: 'existing' },
                    { label: 'Create New List', value: 'new' },
                ],
            },
        }),
        list_key: Property.DynamicProperties({
            displayName: 'Existing List',
            required: true,
            refreshers: ['auth', 'list_choice'],
            props: async (propsValue) => {
                
                const fields: InputPropertyMap = {};
                const auth = propsValue['auth'] as OAuth2PropertyValue;
                const list_choice = propsValue['list_choice'] as unknown as string;

                if (auth && list_choice === 'existing') {
                    fields['list'] = zohoCampaignsSingleMailingListDropdown;
                }
                return fields;
            },
        }),
        new_list_details: Property.DynamicProperties({
            displayName: 'New List Details',
            required: true,
            refreshers: ['auth', 'list_choice'],
            props: async (propsValue) => {
                
                const fields: InputPropertyMap = {};
                const auth = propsValue['auth'] as OAuth2PropertyValue;
                const list_choice = propsValue['list_choice'] as unknown as string;

                if (auth && list_choice === 'new') {
                    fields['list_name'] = Property.ShortText({
                        displayName: 'New List Name',
                        required: true,
                    });
                    fields['list_description'] = Property.LongText({
                        displayName: 'List Description',
                        required: false,
                    });
                }
                return fields;
            },
        }),
    },
    async run({ auth, propsValue }) {
        let endpoint = '';
        const bodyParams: { [key: string]: string } = {
            resfmt: 'JSON',
            emailids: propsValue.email as string,
        };

        if (propsValue.list_choice === 'existing') {
            endpoint = 'https://campaigns.zoho.com/api/v1.1/addlistsubscribersinbulk';
            bodyParams['listkey'] = (propsValue.list_key as { list: string }).list;
        } else { 
            endpoint = 'https://campaigns.zoho.com/api/v1.1/addlistandcontacts';
            const newListDetails = propsValue.new_list_details as { list_name: string, list_description?: string };
            bodyParams['listname'] = newListDetails.list_name;
            bodyParams['signupform'] = 'private'; // As per docs for API addition
            bodyParams['mode'] = 'newlist';
            if (newListDetails.list_description) {
                bodyParams['listdescription'] = newListDetails.list_description;
            }
        }

        const body = new URLSearchParams(bodyParams);
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: endpoint,
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        return response.body;
    },
});