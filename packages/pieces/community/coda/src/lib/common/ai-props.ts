import { Property } from '@activepieces/pieces-framework';

function docId() {
	return Property.ShortText({
		displayName: 'Doc ID or Link',
		description: 'The doc ID (for example AbC123xyZ) or the doc\'s browser link. Use List Docs to find it.',
		required: true,
	});
}

function tableIdOrName() {
	return Property.ShortText({
		displayName: 'Table ID or Name',
		description: 'The table ID (starts with "grid-" or "table-") or its exact name. IDs are safer: names can change or repeat. Use List Tables to find it.',
		required: true,
	});
}

function rowIdOrName() {
	return Property.ShortText({
		displayName: 'Row ID',
		description: 'The row ID (starts with "i-"), for example from List Rows. A display-column value also works, but if several rows share it Coda picks one at random.',
		required: true,
	});
}

function pageIdOrName() {
	return Property.ShortText({
		displayName: 'Page ID or Name',
		description: 'The page ID (starts with "canvas-") or its exact name. Use List Pages to find it.',
		required: true,
	});
}

function limit({ max, defaultValue }: { max: number; defaultValue: number }) {
	return Property.Number({
		displayName: 'Limit',
		description: `How many items to return in this page (1-${max}).`,
		required: false,
		defaultValue,
	});
}

function pageToken() {
	return Property.ShortText({
		displayName: 'Page Token',
		description: 'Leave empty for the first page. To get the next page, pass the Next Page Token from the previous result.',
		required: false,
	});
}

function waitForCompletion() {
	return Property.Checkbox({
		displayName: 'Wait for Coda to Apply',
		description: 'Coda applies changes in the background. When on, the step waits up to 30 seconds until the change is applied; if it takes longer, the step still succeeds with Completed = false and you can check later with Get Mutation Status.',
		required: false,
		defaultValue: true,
	});
}

function contentFormat() {
	return Property.StaticDropdown({
		displayName: 'Content Format',
		required: false,
		defaultValue: 'markdown',
		options: {
			disabled: false,
			options: [
				{ label: 'Markdown', value: 'markdown' },
				{ label: 'HTML', value: 'html' },
			],
		},
	});
}

export const codaProps = {
	docId,
	tableIdOrName,
	rowIdOrName,
	pageIdOrName,
	limit,
	pageToken,
	waitForCompletion,
	contentFormat,
};
