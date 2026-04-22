import { DynamicPropsValue, Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { googleDocsAuth, createGoogleClient } from '../auth';
import { findTextLocation, flattenDoc } from '../common';
import { documentIdProp } from '../common/props';

type Position = 'end' | 'beginning' | 'after' | 'before' | 'custom';
type SizePreset = 'small' | 'medium' | 'large' | 'original' | 'custom';

export const insertImage = createAction({
	auth: googleDocsAuth,
	name: 'insert_image',
	displayName: 'Insert Image',
	description: 'Insert an image (by URL) into a Google Doc at a chosen position and size.',
	props: {
		documentId: documentIdProp('Document', 'The Google Doc to insert the image into.'),
		imageUrl: Property.ShortText({
			displayName: 'Image URL',
			description:
				'Publicly accessible image URL. Must be PNG, JPEG, or GIF, under 50 MB / 25 megapixels, and return the image directly (no redirects, no authentication). URL-encode special characters like spaces and parentheses.',
			required: true,
		}),
		position: Property.StaticDropdown<Position>({
			displayName: 'Where to Insert',
			description: 'Pick where the image should land in the document.',
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
						description: `The existing text in the document the image should be inserted ${pos === 'after' ? 'after' : 'before'}.`,
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
						description: 'Advanced: the exact 1-based character index. Index 1 is the start of the document body.',
						required: true,
					});
				}
				return fields;
			},
		}),
		size: Property.StaticDropdown<SizePreset>({
			displayName: 'Image Size',
			description: 'Pick a preset, or choose Custom to set width/height in points.',
			required: true,
			defaultValue: 'original',
			options: {
				disabled: false,
				options: [
					{ label: 'Original (as provided by the image)', value: 'original' },
					{ label: 'Small — 100 pt wide', value: 'small' },
					{ label: 'Medium — 300 pt wide', value: 'medium' },
					{ label: 'Large — 500 pt wide', value: 'large' },
					{ label: 'Custom width and height', value: 'custom' },
				],
			},
		}),
		sizeDetails: Property.DynamicProperties({
			auth: googleDocsAuth,
			displayName: 'Size Details',
			required: false,
			refreshers: ['size'],
			props: async ({ size }) => {
				const preset = (size as unknown as string) ?? 'original';
				const fields: DynamicPropsValue = {};
				if (preset === 'custom') {
					fields['width'] = Property.Number({
						displayName: 'Width (pt)',
						description: 'Image width in points. 1 point = 1/72 inch. Leave empty to keep auto-width.',
						required: false,
					});
					fields['height'] = Property.Number({
						displayName: 'Height (pt)',
						description: 'Image height in points. Leave empty to keep auto-height.',
						required: false,
					});
				}
				return fields;
			},
		}),
	},
	async run(context) {
		const documentId = context.propsValue.documentId as string;
		const imageUrl = context.propsValue.imageUrl as string;
		const position = (context.propsValue.position as Position | undefined) ?? 'end';
		const positionDetails = context.propsValue.positionDetails ?? {};
		const size = (context.propsValue.size as SizePreset | undefined) ?? 'original';
		const sizeDetails = context.propsValue.sizeDetails ?? {};

		const authClient = await createGoogleClient(context.auth);
		const docs = google.docs({ version: 'v1', auth: authClient });

		const insertLocation = await resolveInsertLocation({
			docs,
			documentId,
			position,
			details: positionDetails,
		});

		const objectSize = resolveObjectSize(size, sizeDetails);

		await docs.documents.batchUpdate({
			documentId,
			requestBody: {
				requests: [
					{
						insertInlineImage: {
							uri: imageUrl,
							...insertLocation,
							...objectSize,
						},
					},
				],
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

function resolveObjectSize(
	preset: SizePreset,
	details: Record<string, unknown>,
): { objectSize?: { width?: { magnitude: number; unit: string }; height?: { magnitude: number; unit: string } } } {
	if (preset === 'original') return {};
	if (preset === 'small') return { objectSize: { width: pt(100) } };
	if (preset === 'medium') return { objectSize: { width: pt(300) } };
	if (preset === 'large') return { objectSize: { width: pt(500) } };
	const width = Number(details['width']);
	const height = Number(details['height']);
	const size: { width?: { magnitude: number; unit: string }; height?: { magnitude: number; unit: string } } = {};
	if (Number.isFinite(width) && width > 0) size.width = pt(width);
	if (Number.isFinite(height) && height > 0) size.height = pt(height);
	return Object.keys(size).length > 0 ? { objectSize: size } : {};
}

function pt(magnitude: number): { magnitude: number; unit: string } {
	return { magnitude, unit: 'PT' };
}
