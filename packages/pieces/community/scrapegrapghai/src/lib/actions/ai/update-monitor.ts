import { createAction } from '@activepieces/pieces-framework';

import { scrapegraphaiAuth } from '../../auth';
import { scrapegraphaiAiProps } from '../../common/ai-props';
import { scrapegraphaiApi } from '../../common/api';
import { scrapegraphaiUtils } from '../../common/utils';

export const updateMonitorAction = createAction({
	auth: scrapegraphaiAuth,
	name: 'scrapegrapghai_update_monitor',
	displayName: 'Update Monitor',
	description: "Updates a monitor's schedule, name, formats, webhook or fetch options.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you set on a monitor: interval, name, formats, webhook URL or fetch options. The watched URL cannot be changed; create a new monitor for a different page.',
		idempotent: true,
	},
	props: {
		monitorId: scrapegraphaiAiProps.monitorId({ required: true }),
		interval: scrapegraphaiAiProps.interval({ required: false }),
		name: scrapegraphaiAiProps.monitorName({ required: false }),
		formats: scrapegraphaiAiProps.formats({ required: false }),
		mode: scrapegraphaiAiProps.formatMode({ required: false }),
		jsonPrompt: scrapegraphaiAiProps.jsonPrompt({ required: false }),
		jsonSchema: scrapegraphaiAiProps.jsonSchema({ required: false }),
		webhookUrl: scrapegraphaiAiProps.webhookUrl({ required: false }),
		fetchConfig: scrapegraphaiAiProps.fetchConfig({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await scrapegraphaiApi.updateMonitor({
			auth,
			monitorId: propsValue.monitorId,
			interval: propsValue.interval,
			name: propsValue.name,
			formats: propsValue.formats
				? scrapegraphaiUtils.buildFormats({
						types: propsValue.formats,
						mode: propsValue.mode,
						jsonPrompt: propsValue.jsonPrompt,
						jsonSchema: propsValue.jsonSchema,
				  })
				: undefined,
			webhookUrl: propsValue.webhookUrl,
			fetchConfig: propsValue.fetchConfig,
		});
	},
});
