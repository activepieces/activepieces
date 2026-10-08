import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';
import { createSmsCampaignActionOutputSchema } from '../output-schemas';

export const createSmsCampaign = createAction({
	auth: sendinblueAuth,
	name: 'create_sms_campaign',
	outputSchema: createSmsCampaignActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Create SMS Campaign',
	description: 'Create a new SMS campaign in Brevo.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates a Brevo SMS campaign targeting one or more contact lists, exclusion lists and/or segments. Omit scheduled_at to create an unsent draft that can be reviewed or scheduled later. Not idempotent — calling this again creates another campaign.',
		idempotent: false,
	},
	props: {
		name: Property.ShortText({
			displayName: 'Name',
			description: 'Internal campaign name.',
			required: true,
		}),
		sender: Property.ShortText({
			displayName: 'Sender',
			description:
				'Name or number shown as the sender. Limited to 11 alphanumeric characters or 15 numeric characters.',
			required: true,
		}),
		content: Property.LongText({
			displayName: 'Content',
			description:
				'Message body. Max 160 characters per SMS segment; longer content is split into multiple billed segments.',
			required: true,
		}),
		list_ids: brevoProps.listIds({
			displayName: 'Recipient Lists',
			description: 'Contact lists to send this campaign to.',
		}),
		exclusion_list_ids: brevoProps.listIds({
			displayName: 'Exclude Lists',
			description: 'Contact lists to exclude from this campaign.',
		}),
		segment_ids: Property.Array({
			displayName: 'Segment IDs',
			description: 'Brevo segment IDs to target.',
			required: false,
		}),
		scheduled_at: Property.DateTime({
			displayName: 'Scheduled At',
			description: 'Omit to create an unsent draft.',
			required: false,
		}),
		unicode_enabled: Property.Checkbox({
			displayName: 'Unicode Enabled',
			required: false,
			defaultValue: false,
		}),
		organisation_prefix: Property.ShortText({
			displayName: 'Organisation Prefix',
			description: 'Brand name prepended to the message content.',
			required: false,
		}),
		unsubscribe_instruction: Property.ShortText({
			displayName: 'Unsubscribe Instruction',
			description: 'Must include the word STOP; recommended by US carriers.',
			required: false,
		}),
	},
	async run(context) {
		const {
			name,
			sender,
			content,
			list_ids,
			exclusion_list_ids,
			segment_ids,
			scheduled_at,
			unicode_enabled,
			organisation_prefix,
			unsubscribe_instruction,
		} = context.propsValue;

		const listIds = (list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		const exclusionListIds = (exclusion_list_ids ?? [])
			.map((listId) => Number(listId))
			.filter((listId) => Number.isFinite(listId));

		const segmentIds = (Array.isArray(segment_ids) ? segment_ids : [])
			.map((segmentId) => Number(segmentId))
			.filter((segmentId) => Number.isFinite(segmentId));

		const hasRecipients =
			listIds.length > 0 || exclusionListIds.length > 0 || segmentIds.length > 0;

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/smsCampaigns',
			body: {
				name,
				sender,
				content,
				recipients: hasRecipients
					? {
							listIds: listIds.length > 0 ? listIds : undefined,
							exclusionListIds: exclusionListIds.length > 0 ? exclusionListIds : undefined,
							segmentIds: segmentIds.length > 0 ? segmentIds : undefined,
					  }
					: undefined,
				scheduledAt: scheduled_at,
				unicodeEnabled: unicode_enabled,
				organisationPrefix: organisation_prefix,
				unsubscribeInstruction: unsubscribe_instruction,
			},
		});
	},
});
