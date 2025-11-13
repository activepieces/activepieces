import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { googleSheetsAuth } from '../..';
import { commonProps } from '../common/props';
import { areSheetIdsValid } from '../common/common';

export const exportSheetAction = createAction({
  name: 'export_sheet',
  displayName: 'Export Sheet',
  description: 'Export a Google Sheets tab to CSV or TSV format.',
  auth: googleSheetsAuth,
  props: {
    ...commonProps,
    format: Property.StaticDropdown({
      displayName: 'Export Format',
      description: 'The format to export the sheet to.',
      required: true,
      defaultValue: 'csv',
      options: {
        disabled: false,
        options: [
          { label: 'Comma Separated Values (.csv)', value: 'csv' },
          { label: 'Tab Separated Values (.tsv)', value: 'tsv' },
        ],
      },
    }),
    returnAsText: Property.Checkbox({
      displayName: 'Return as Text',
      description: 'Return the exported data as text instead of a file.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ propsValue, auth, files }) {
    const { spreadsheetId, sheetId, format, returnAsText } = propsValue;

    if (!areSheetIdsValid(spreadsheetId, sheetId)) {
      throw new Error('Please select a spreadsheet and sheet first.');
    }

    const spreadsheet_id = spreadsheetId as string;
    const sheet_id = sheetId as number;

    const exportUrl = `https://docs.google.com/spreadsheets/d/${spreadsheet_id}/export?format=${format}&id=${spreadsheet_id}&gid=${sheet_id}`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: exportUrl,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.access_token,
        },
        responseType: 'arraybuffer',
      });

      if (returnAsText) {
        const textData = Buffer.from(response.body).toString('utf-8');
        return {
          text: textData,
          format,
        };
      } else {
        const filename = `exported_sheet.${format}`;

        const file = await files.write({
          fileName: filename,
          data: Buffer.from(response.body),
        });

        return {
          file,
          filename,
          format,
        };
      }
    } catch (error) {
      throw new Error(`Failed to export sheet: ${error}`);
    }
  },
});
