import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegraphaiUtils } from '../../common/utils';
import { scrapegrapghaiMonitorOutputSchema } from '../../output-schemas';

export const createMonitorAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_create_monitor',
	outputSchema: scrapegrapghaiMonitorOutputSchema,
	displayName: 'Create Monitor',
	description: 'Schedules a recurring fetch of a page with change detection.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Creates a monitor that fetches a URL on a cron schedule, captures it in the chosen formats and records what changed between runs, optionally posting each run to a webhook. Returns the monitor with its `cronId`. Uses one of the plan's monitor slots.",
		idempotent: false,
	},
	props: {
		url: scrapegraphaiAiProps.url({
			required: true,
			description: 'Public page URL to watch, including the scheme.',
		}),
		interval: scrapegraphaiAiProps.interval({ required: true }),
		name: scrapegraphaiAiProps.monitorName({ required: false }),
		formats: scrapegraphaiAiProps.formats({ required: false }),
		mode: scrapegraphaiAiProps.formatMode({ required: false }),
		jsonPrompt: scrapegraphaiAiProps.jsonPrompt({ required: false }),
		jsonSchema: scrapegraphaiAiProps.jsonSchema({ required: false }),
		webhookUrl: scrapegraphaiAiProps.webhookUrl({ required: false }),
		fetchConfig: scrapegraphaiAiProps.fetchConfig({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.createMonitor({
			auth,
			url: propsValue.url,
			interval: propsValue.interval,
			name: propsValue.name,
			formats: scrapegraphaiUtils.buildFormats({
				types: propsValue.formats,
				mode: propsValue.mode,
				jsonPrompt: propsValue.jsonPrompt,
				jsonSchema: propsValue.jsonSchema,
			}),
			webhookUrl: propsValue.webhookUrl,
			fetchConfig: propsValue.fetchConfig,
		});
	},
});
