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

export const newCampaign = createTrigger({
	auth: zohoCampaignsAuth,

	name: 'new_campaign',
	displayName: 'New Campaign',
	description: 'Fires when a new campaign is created',
	type: TriggerStrategy.POLLING,
	sampleData: {
		campaign_name: 'Sample Campaign',
		email_subject: 'Welcome!',
		created_time: '1700000000000',
	},
	props: {
		status: Property.StaticDropdown({
			displayName: 'Status Filter',
			description: 'Filter by campaign status',
			required: false,
			options: {
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Drafts', value: 'drafts' },
					{ label: 'Scheduled', value: 'scheduled' },
					{ label: 'In Progress', value: 'inprogress' },
					{ label: 'Sent', value: 'sent' },
					{ label: 'Stopped', value: 'stopped' },
					{ label: 'Canceled', value: 'canceled' },
					{ label: 'To Be Reviewed', value: 'tobereviewed' },
					{ label: 'Reviewed', value: 'reviewed' },
					{ label: 'Paused', value: 'paused' },
					{ label: 'In Testing', value: 'intesting' },
				],
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

const polling: Polling<OAuth2PropertyValue, unknown> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue }) => {
		const accessToken = auth.access_token;
		const location = (auth.props && auth.props['location']) || 'zoho.com';
		const baseUrl = `https://campaigns.${location}/api/v1.1`;

		const query: Record<string, string> = {
			resfmt: 'JSON',
			sort: 'desc',
			fromindex: '1',
			range: '5',
		};
		const status = (propsValue as any)?.status as string | undefined;
		if (status) {
			query['status'] = status;
		}

		const response = await httpClient.sendRequest<{ recent_campaigns?: any[] } | any>({
			method: HttpMethod.GET,
			url: `${baseUrl}/recentcampaigns`,
			queryParams: query,
			headers: {
				Authorization: `Zoho-oauthtoken ${accessToken}`,
			},
			// Note: Zoho Campaigns expects Zoho-oauthtoken header, not standard Bearer
		});

		const body = response.body || {};
		const items: any[] = Array.isArray(body)
			? body
			: body.recent_campaigns || [];

		return items.map((c) => ({
			epochMilliSeconds: Number(c.created_time) || Date.now(),
			data: c,
		}));
	},
};


