import { DynamicPropsValue, Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { googleDocsAuth, createGoogleClient } from '../auth';
import { findTextLocation, flattenDoc } from '../common';
import { documentIdProp } from '../common/props';

type Position = 'end' | 'beginning' | 'after' | 'before' | 'custom';

export const insertText = createAction({
	auth: googleDocsAuth,
	name: 'insert_text',
	displayName: 'Insert Text',
	description: 'Insert text into a Google Doc at a specific position — end, beginning, or anchored to existing text.',
	props: {
		documentId: documentIdProp('Document', 'The Google Doc to insert text into.'),
		text: Property.LongText({
			displayName: 'Text to Insert',
			description: 'The text to insert.',
			required: true,
		}),
		position: Property.StaticDropdown<Position>({
			displayName: 'Where to Insert',
			description: 'Pick where the new text should land.',
			required: true,
			defaultValue: 'end',
			options: {
				disabled: false,
				options: [
					{ label: 'At the end of the document', value: 'end' },
					{ label: 'At the beginning of the document', value: 'beginning' },
					{ label: 'After specific text', value: 'after' },
					{ label: 'Before specific text', value: 'before' },
					{ label: 'At a specific character index (advanced)', value: 'custom' },
				],
			},
		}),
		positionDetails: Property.DynamicProperties({
			auth: googleDocsAuth,
			displayName: 'Position Details',
			required: false,
			refreshers: ['position'],
			props: async ({ position }) => {
				const pos = (position as unknown as string) ?? 'end';
				const fields: DynamicPropsValue = {};
				if (pos === 'after' || pos === 'before') {
					fields['searchText'] = Property.ShortText({
						displayName: 'Anchor Text',
						description: `The existing text in the document the new text should be inserted ${pos === 'after' ? 'after' : 'before'}.`,
						required: true,
					});
					fields['matchCase'] = Property.Checkbox({
						displayName: 'Match case',
						description: 'When enabled, the anchor text search is case-sensitive.',
						required: false,
						defaultValue: false,
					});
				} else if (pos === 'custom') {
					fields['index'] = Property.Number({
						displayName: 'Character Index',
						description: 'Advanced: the exact 1-based character index. Index 1 is the start of the document body. Use only if you know the index.',
						required: true,
					});
				}
				return fields;
			},
		}),
	},
	async run(context) {
		const documentId = context.propsValue.documentId as string;
		const text = context.propsValue.text as string;
		const position = (context.propsValue.position as Position | undefined) ?? 'end';
		const positionDetails = context.propsValue.positionDetails ?? {};

		const authClient = await createGoogleClient(context.auth);
		const docs = google.docs({ version: 'v1', auth: authClient });

		const insertLocation = await resolveInsertLocation({
			docs,
			documentId,
			position,
			details: positionDetails,
		});

		await docs.documents.batchUpdate({
			documentId,
			requestBody: {
				requests: [{ insertText: { text, ...insertLocation } }],
			},
		});

		const finalDoc = await docs.documents.get({ documentId });
		return flattenDoc(finalDoc.data);
	},
});

type DocsClient = ReturnType<typeof google.docs>;

async function resolveInsertLocation({
	docs,
	documentId,
	position,
	details,
}: {
	docs: DocsClient;
	documentId: string;
	position: Position;
	details: Record<string, unknown>;
}): Promise<{ location: { index: number } } | { endOfSegmentLocation: Record<string, never> }> {
	if (position === 'beginning') {
		return { location: { index: 1 } };
	}
	if (position === 'custom') {
		const index = Number(details['index']);
		if (!Number.isFinite(index) || index < 1) {
			throw new Error('Character Index must be a number 1 or greater.');
		}
		return { location: { index } };
	}
	if (position === 'after' || position === 'before') {
		const searchText = String(details['searchText'] ?? '').trim();
		if (!searchText) {
			throw new Error('Anchor Text is required when inserting after/before specific text.');
		}
		const doc = await docs.documents.get({ documentId });
		const index = findTextLocation({
			document: doc.data,
			searchText,
			mode: position,
			matchCase: Boolean(details['matchCase']),
		});
		return { location: { index } };
	}
	return { endOfSegmentLocation: {} };
}
