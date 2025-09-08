import {
	AuthenticationType,
	DedupeStrategy,
	httpClient,
	HttpMethod,
	Polling,
	pollingHelper,
} from '@activepieces/pieces-common';
import {
	createTrigger,
	OAuth2PropertyValue,
	Property,
	TriggerStrategy,
} from '@activepieces/pieces-framework';
import { zohoCampaignsAuth } from '../common/auth';

type ListItem = {
	listname?: string;
	listkey?: string;
	noofcontacts?: string;
};

export const unsubscribedContact = createTrigger({
	auth: zohoCampaignsAuth,
	name: 'unsubscribed_contact',
	displayName: 'Unsubscribe',
	description: 'Fires when a contact is removed from a mailing list or unsubscribed.',
	type: TriggerStrategy.POLLING,
	sampleData: {
		contact_email: 'john.doe@example.com',
		listkey: '3c20ad524dfa4af86216a5be13e238ed',
	},
	props: {
		listkey: Property.Dropdown({
			displayName: 'Mailing List',
			description: 'Select the mailing list to monitor for unsubscribes',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return { disabled: true, placeholder: 'Connect Zoho Campaigns first', options: [] };
				}
				const { access_token, props } = auth as OAuth2PropertyValue;
				const location = (props && props['location']) || 'zoho.com';
				const baseUrl = `https://campaigns.${location}/api/v1.1`;
				const resp = await httpClient.sendRequest({
					method: HttpMethod.GET,
					url: `${baseUrl}/getmailinglists`,
					queryParams: { resfmt: 'JSON', sort: 'desc', fromindex: '1', range: '200' },
					headers: { Authorization: `Zoho-oauthtoken ${access_token}` },
				});
				const body = resp.body || {};
				const lists: ListItem[] = body.list_of_details || [];
				return {
					disabled: false,
					options: (lists as ListItem[]).map((l) => ({
						label: l.listname || 'Unnamed list',
						value: l.listkey!,
					})).filter((o) => o.value),
				};
			},
		}),
	},
	async run(context) {
		return await pollingHelper.poll(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
			files: context.files,
		});
	},
	async test({ auth, propsValue, store, files }): Promise<unknown[]> {
		return await pollingHelper.test(polling, {
			auth,
			store: store,
			propsValue: propsValue,
			files: files,
		});
	},
	async onEnable({ auth, propsValue, store }): Promise<void> {
		await pollingHelper.onEnable(polling, {
			auth,
			store: store,
			propsValue: propsValue,
		});
	},
	async onDisable({ auth, propsValue, store }): Promise<void> {
		await pollingHelper.onDisable(polling, {
			auth,
			store: store,
			propsValue: propsValue,
		});
	},
});

const polling: Polling<OAuth2PropertyValue, { listkey: string }> = {
	strategy: DedupeStrategy.LAST_ITEM,
	items: async ({ auth, propsValue, store }) => {
		const accessToken = auth.access_token;
		const location = (auth.props && auth.props['location']) || 'zoho.com';
		const baseUrl = `https://campaigns.${location}/api/v1.1`;
		const listkey = propsValue.listkey as string;

		const resp = await httpClient.sendRequest<{ list_of_details?: any[] } | any>({
			method: HttpMethod.GET,
			url: `${baseUrl}/getlistsubscribers`,
			queryParams: {
				resfmt: 'JSON',
				listkey,
				sort: 'desc',
				fromindex: '1',
				range: '200',
				status: 'unsub',
			},
			headers: {
				Authorization: `Zoho-oauthtoken ${accessToken}`,
			},
		});

		const body = resp.body || {};
		const items: any[] = body.list_of_details || [];
		const currentEmails: string[] = items
			.map((c) => c.contact_email)
			.filter((e) => typeof e === 'string');

		const storeKey = `unsub_emails_${listkey}`;
		const prevEmails = (await store.get<string[]>(storeKey)) || [];
		const prevSet = new Set(prevEmails);
		const newEmails = currentEmails.filter((e) => !prevSet.has(e));

		await store.put(storeKey, currentEmails);

		return items
			.filter((c) => newEmails.includes(c.contact_email))
			.map((c) => ({ id: c.contact_email, data: c }));
	},
};


