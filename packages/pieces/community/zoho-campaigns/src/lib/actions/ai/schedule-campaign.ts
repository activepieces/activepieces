import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoCampaignsAuth } from '../../auth';
import { zohoCampaignsAiProps } from '../../common/ai-props';
import { zohoCampaignsApi } from '../../common/api';
import { zohoCampaignsUtils } from '../../common/utils';
import { zohoCampaignsSendCampaignOutputSchema } from '../../output-schemas';

const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export const scheduleCampaignAction = createAction({
	auth: zohoCampaignsAuth,
	name: 'zoho_campaigns_schedule_campaign',
	displayName: 'Schedule Campaign',
	description: 'Schedules a draft campaign to send at a set date and time.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Schedules a draft campaign (key from Create Campaign or List Campaigns) to send at a future date and time. Use Send Campaign to send now. Not idempotent; delete the campaign with Delete Campaign to cancel. Sending needs a sender domain with SPF and DKIM set up in Zoho; until then it fails with "Content not reviewed".',
		idempotent: false,
	},
	outputSchema: zohoCampaignsSendCampaignOutputSchema,
	props: {
		campaignKey: zohoCampaignsAiProps.campaignKey({ required: true }),
		scheduleDate: Property.ShortText({
			displayName: 'Schedule Date',
			description: 'Send date in mm/dd/yyyy format, e.g. "01/19/2027".',
			required: true,
		}),
		scheduleHour: Property.StaticDropdown({
			displayName: 'Hour',
			description: 'Hour of the send time on a 12-hour clock (1-12).',
			required: true,
			options: {
				disabled: false,
				options: HOURS.map((hour) => ({ label: hour, value: hour })),
			},
		}),
		scheduleMinute: Property.StaticDropdown({
			displayName: 'Minute',
			description: 'Minute of the send time, in 5-minute steps (00-55).',
			required: true,
			options: {
				disabled: false,
				options: MINUTES.map((minute) => ({ label: minute, value: minute })),
			},
		}),
		amPm: Property.StaticDropdown<'AM' | 'PM', true>({
			displayName: 'AM/PM',
			description: 'Whether the hour is AM or PM.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'AM', value: 'AM' },
					{ label: 'PM', value: 'PM' },
				],
			},
		}),
		sendingTZ: Property.ShortText({
			displayName: 'Time Zone',
			description:
				'IANA time zone of the send time, e.g. "Asia/Kolkata". Defaults to the account time zone.',
			required: false,
		}),
		isTimeWarp: Property.StaticDropdown<boolean, false>({
			displayName: 'Time Warp',
			description:
				"Yes delivers at the scheduled time in each recipient's own time zone. Leave unset for the account default.",
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Yes', value: true },
					{ label: 'No', value: false },
				],
			},
		}),
	},
	async run({ auth, propsValue }) {
		const body = await zohoCampaignsApi.scheduleCampaign({
			auth,
			campaignkey: propsValue.campaignKey,
			scheduleDate: propsValue.scheduleDate,
			scheduleHour: propsValue.scheduleHour,
			scheduleMinute: propsValue.scheduleMinute,
			amPm: propsValue.amPm,
			isTimeWarp: propsValue.isTimeWarp,
			sendingTZ: propsValue.sendingTZ,
		});
		return zohoCampaignsUtils.assertSuccess({ body });
	},
});
