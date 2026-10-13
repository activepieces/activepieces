import { createAction, Property } from '@activepieces/pieces-framework';
import { intercomAuth } from '../../auth';
import { requireText, setRecordTag, TagTarget } from '../../common/lookups';
import { tagOrUntagOutputSchema } from '../../output-schemas';

export const tagOrUntagRecordAction = createAction({
	auth: intercomAuth,
	name: 'tag_or_untag_record',
	classification: 'WRITE',
	displayName: 'Tag or Untag Record',
	description: 'Adds or removes a tag on a contact, conversation, company or ticket.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Adds or removes a tag on a contact, conversation, company or ticket by record ID. Pass a tag ID or a tag name; when adding, a name that does not exist yet is created. Applying a tag that is already there, or removing one that is not applied, succeeds and leaves the same state (already_in_state is true only when the tag does not exist at all), so it is safe to retry.',
		idempotent: true,
	},
	props: {
		target: Property.StaticDropdown({
			displayName: 'Record Type',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Contact', value: 'contact' },
					{ label: 'Conversation', value: 'conversation' },
					{ label: 'Company', value: 'company' },
					{ label: 'Ticket', value: 'ticket' },
				],
			},
		}),
		recordId: Property.ShortText({
			displayName: 'Record ID',
			description: 'The Intercom ID of the contact, conversation, company (Intercom company ID, not your Company ID) or ticket.',
			required: true,
		}),
		tagId: Property.ShortText({
			displayName: 'Tag ID',
			description: 'The tag ID from List Tags. Give either Tag ID or Tag Name.',
			required: false,
		}),
		tagName: Property.ShortText({
			displayName: 'Tag Name',
			description: 'The tag name (case-insensitive). Give either Tag ID or Tag Name.',
			required: false,
		}),
		remove: Property.Checkbox({
			displayName: 'Remove Tag',
			description: 'Turn on to remove the tag instead of adding it.',
			required: false,
			defaultValue: false,
		}),
	},
	outputSchema: tagOrUntagOutputSchema,
	async run(context) {
		const target = parseTarget(context.propsValue.target);
		const recordId = requireText({ label: 'Record ID', value: context.propsValue.recordId });
		const tagId = context.propsValue.tagId?.trim() || undefined;
		const tagName = context.propsValue.tagName?.trim() || undefined;
		if ((tagId === undefined) === (tagName === undefined)) {
			throw new Error('Give exactly one of Tag ID or Tag Name.');
		}
		const remove = context.propsValue.remove === true;
		return setRecordTag({ auth: context.auth, target, recordId, tagId, tagName, remove });
	},
});

function parseTarget(value: unknown): TagTarget {
	if (value === 'contact' || value === 'conversation' || value === 'company' || value === 'ticket') {
		return value;
	}
	throw new Error('Record Type must be contact, conversation, company or ticket.');
}
