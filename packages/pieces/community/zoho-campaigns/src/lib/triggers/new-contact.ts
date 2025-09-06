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

const triggerName = 'new_contact_trigger';

export const newContact = createTrigger({
    auth: zohoCampaignsAuth,
    name: 'new_contact',
    displayName: 'New Contact',
    description: 'Fires when a new contact is added to a selected mailing list.',
    props: {
        list_key: zohoCampaignsSingleMailingListDropdown,
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        "phone": "",
        "zuid": "4158867",
        "contact_email": "user.new@example.com",
        "lastname": "Doe",
        "firstname": "John",
        "companyname": "Example Inc."
    },

    async onEnable(context) {
        
        const contacts = await getContacts(
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
        
        const currentContacts = await getContacts(
            context.auth.access_token,
            context.propsValue.list_key
        );

        const currentContactEmails = currentContacts.map(c => c.contact_email);

        const newContacts: Contact[] = [];
        for (const contact of currentContacts) {
            if (!storedContactEmails.includes(contact.contact_email)) {
                newContacts.push(contact);
            }
        }

        
        await context.store.put(triggerName, currentContactEmails);

        return newContacts;
    },
});


async function getContacts(accessToken: string, listKey: string): Promise<Contact[]> {
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
            status: 'active'
        },
    });

    return response.body.list_of_details || [];
}