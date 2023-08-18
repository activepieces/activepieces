import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { blackbaudCommon } from '../common/common';
import { blackbaudAuth } from '../..';


export const blackbaudSearchAfterDate = createAction({
    auth: blackbaudAuth,
    name: 'search_contacts_after_date',
    description: 'Search contacts',
    displayName: 'Search Contacts After Date',
    props: {
        ...blackbaudCommon.auth_props,
        last_modified_date: Property.ShortText({
            displayName: "Last Modified Date",
            description: "The date to search for contacts modified after",
            defaultValue: "2021-01-01T00:00:00.000Z",
            required: true
        })
    },
    async run(configValue) {
        const accessToken = configValue.auth.access_token;
        return (await httpClient.sendRequest<{ count: number; next_link: string; value: unknown[] }>({
            method: HttpMethod.GET,
            url: `https://api.sky.blackbaud.com/constituent/v1/constituents?limit=1000&sort=date_modified&last_modified_date=${configValue.propsValue['last_modified_date']}`,
            headers: {
                "Bb-Api-Subscription-Key": configValue.propsValue['subscription_key'],
                Authorization: `Bearer ${accessToken}`,
            },
        })).body.value;
    },
});
