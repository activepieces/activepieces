import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { zohoCampaignsAuth } from '../..';
import { zohoCampaignsSingleMailingListDropdown } from '../common/props';


type Contact = {
    contact_email: string;
    [key: string]: unknown;
};


interface GetSubscribersResponse {
    "list_of_details": Contact[];
}

const triggerName = 'new_unsubscribe_trigger';

export const newUnsubscribe = createTrigger({
    auth: zohoCampaignsAuth,
    name: 'new_unsubscribe',
    displayName: 'New Unsubscribe',
    description: 'Fires when a contact unsubscribes from a selected mailing list.',
    props: {
        list_key: zohoCampaignsSingleMailingListDropdown,
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        "phone": "",
        "zuid": "4158867",
        "contact_email": "user.unsubscribed@example.com",
        "lastname": "Doe",
        "firstname": "Jane",
        "companyname": "Example Inc."
    },

    async onEnable(context) {
        const contacts = await getUnsubscribedContacts(
            context.auth.access_token,
            context.propsValue.list_key
        );
        const contactEmails = contacts.map(c => c.contact_email);
        await context.store.put(triggerName, contactEmails);
    },

    async onDisable(context) {
        await context.store.delete(triggerName);
    },

    async run(context) {
        const storedContactEmails = (await context.store.get<string[]>(triggerName)) ?? [];
        
        const currentContacts = await getUnsubscribedContacts(
            context.auth.access_token,
            context.propsValue.list_key
        );

        const currentContactEmails = currentContacts.map(c => c.contact_email);
        
        const newUnsubscribes: Contact[] = [];
        for (const contact of currentContacts) {
            if (!storedContactEmails.includes(contact.contact_email)) {
                newUnsubscribes.push(contact);
            }
        }

        await context.store.put(triggerName, currentContactEmails);

        return newUnsubscribes;
    },
});


async function getUnsubscribedContacts(accessToken: string, listKey: string): Promise<Contact[]> {
    const response = await httpClient.sendRequest<GetSubscribersResponse>({
        method: HttpMethod.GET,
        url: 'https://campaigns.zoho.com/api/v1.1/getlistsubscribers',
        headers: {
            Authorization: `Zoho-oauthtoken ${accessToken}`,
        },
        queryParams: {
            resfmt: 'JSON',
            listkey: listKey,
            sort: 'desc',
            status: 'unsub' 
        },
    });

    return response.body.list_of_details || [];
}