import { createAction, MarkdownVariant, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { commonProps } from '../common/props';
import { getDrivePath, createMSGraphClient } from '../common/helpers';
import { excelCommon, objectToArray } from '../common/common';

export const updateRowAction = createAction({
	auth: excelAuth,
	name: 'update_row',
	classification: 'WRITE',
	description: 'Overwrite a worksheet row, starting at column A.',
	audience: 'both',
	aiMetadata: { description: 'Overwrite the cells of a specific worksheet row, identified by its row number, with the provided values starting at column A. Use to edit an existing row in place; to add a new row use the append actions, or Delete Row to remove one. Idempotent for a given row number and values — re-running writes the same cells. Values can be keyed by header when the first row holds headers.', idempotent: true },
	displayName: 'Update Row',
	propertyGroups: [
		{
			key: 'workbook',
			display: 'section',
			label: 'Workbook',
			icon: 'file',
			props: ['storageSource', 'siteId', 'documentId', 'workbookId', 'worksheetId'],
		},
		{
			key: 'target_row',
			display: 'section',
			label: 'Row',
			icon: 'markdown',
			props: ['row_number'],
		},
		{
			key: 'changes',
			display: 'section',
			label: 'Changes',
			icon: 'text',
			props: ['blank_fields_warning', 'isFirstRowHeaders', 'values'],
		},
	],
	props: {
		storageSource: commonProps.storageSource,
		siteId: commonProps.siteId,
		documentId: commonProps.documentId,
		workbookId: commonProps.workbookId,
		worksheetId: commonProps.worksheetId,
		row_number: Property.Number({
			displayName: 'Row Number',
			description: 'Row 1 is the first row of the worksheet.',
			required: true,
		}),
		blank_fields_warning: Property.MarkDown({
			value: 'Blank fields clear their cell. Fill in every value you want to keep.',
			variant: MarkdownVariant.WARNING,
		}),
		isFirstRowHeaders: commonProps.isFirstRowHeaders,
		values: commonProps.worksheetValues,
	},
	async run({ propsValue, auth }) {
		const { storageSource, siteId, documentId, workbookId, worksheetId } = propsValue;
		const rowNumber = propsValue['row_number'];
		const values = propsValue.isFirstRowHeaders
			? objectToArray(propsValue['values'])
			: Object.values(propsValue['values'])[0];
		const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

		if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
			throw new Error('please select SharePoint site and document library.');
		}
		const drivePath = getDrivePath(storageSource, siteId as string, documentId as string);

		const requestBody = {
			values: [values],
		};

		const lastUsedColumn = excelCommon.numberToColumnName(Object.values(values).length);

		const rangeFrom = `A${rowNumber}`;
		const rangeTo = `${lastUsedColumn}${rowNumber}`;

		const client = createMSGraphClient(auth['access_token'], cloud);
		const response = await client
			.api(`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${rangeFrom}:${rangeTo}')`)
			.patch(requestBody);

		return response;
	},
});
