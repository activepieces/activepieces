import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { objectToArray } from '../common/common';
import { commonProps } from '../common/props';
import { createMSGraphClient, getLastUsedRow, numberToColumnName } from '../common/helpers';
import { WorkbookRange } from '@microsoft/microsoft-graph-types';

export const appendRowAction = createAction({
	auth: excelAuth,
	name: 'append_row',
	description: 'Append row of values to a worksheet',
	displayName: 'Append Row to Worksheet',
	props: {
		storageSource: commonProps.storageSource,
		siteId: commonProps.siteId,
		documentId: commonProps.documentId,
		workbookId: commonProps.workbookId,
		worksheetId: commonProps.worksheetId,
		isFirstRowHeaders: commonProps.isFirstRowHeaders,
		values: commonProps.worksheetValues,
	},
	async run({ propsValue, auth }) {
		const { workbookId, worksheetId, storageSource, siteId, documentId } = propsValue;
		const values = propsValue.isFirstRowHeaders
			? objectToArray(propsValue['values'])
			: Object.values(propsValue['values'])[0];
		const cloud = (auth as OAuth2PropertyValue).props?.['cloud'] as string | undefined;

		if (storageSource === 'sharepoint' && (!siteId || !documentId)) {
			throw new Error('please select SharePoint site and document library.');
		}

		const drivePath =
			storageSource === 'onedrive' ? '/me/drive' : `/sites/${siteId}/drives/${documentId}`;

		const lastUsedRow = await getLastUsedRow(
			auth.access_token,
			drivePath,
			workbookId,
			worksheetId,
			cloud
		);

		const lastUsedColumn = numberToColumnName(Object.values(values).length);

		const rangeFrom = `A${lastUsedRow + 1}`;
		const rangeTo = `${lastUsedColumn}${lastUsedRow + 1}`;
		const insertedRowNumber = lastUsedRow + 1;

		const client = createMSGraphClient(auth.access_token, cloud);

		const response: WorkbookRange = await client
			.api(
				`${drivePath}/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${rangeFrom}:${rangeTo}')`
			)
			.patch({
				values: [values],
			});

		return {
			row: insertedRowNumber,
			...response,
		};
	},
});
