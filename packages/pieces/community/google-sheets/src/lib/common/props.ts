import { googleSheetsAuth } from '../../index';
import {
  DropdownOption,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { google, drive_v3 } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const spreadsheetIdProp = (
  displayName: string,
  description: string,
  required = true
) =>
  Property.Dropdown({
    displayName,
    description,
    required,
    refreshers: ['includeTeamDrives'],
    options: async ({ auth, includeTeamDrives }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please authenticate first',
        };
      }
      const authValue = auth as PiecePropValueSchema<typeof googleSheetsAuth>;

      const authClient = new OAuth2Client();
      authClient.setCredentials(authValue);

      const drive = google.drive({ version: 'v3', auth: authClient });

      const q = [
        "mimeType='application/vnd.google-apps.spreadsheet'",
        'trashed = false',
      ];

      let nextPageToken;
      const options: DropdownOption<string>[] = [];
      do {
        const response: any = await drive.files.list({
          q: q.join(' and '),
          pageToken: nextPageToken,
          orderBy: 'createdTime desc',
          fields: 'nextPageToken, files(id, name)',
          supportsAllDrives: true,
          includeItemsFromAllDrives: includeTeamDrives ? true : false,
        });
        const fileList: drive_v3.Schema$FileList = response.data;

        if (fileList.files) {
          for (const file of fileList.files) {
            options.push({
              label: file.name!,
              value: file.id!,
            });
          }
        }
        nextPageToken = response.data.nextPageToken;
      } while (nextPageToken);

      return {
        disabled: false,
        options,
      };
    },
  });

export const sheetIdProp = (
  displayName: string,
  description: string,
  required = true
) =>
  Property.Dropdown({
    displayName,
    description,
    required,
    refreshers: ['spreadsheetId'],
    options: async ({ auth, spreadsheetId }) => {
      if (!auth || (spreadsheetId ?? '').toString().length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a spreadsheet first.',
        };
      }

      const authValue = auth as PiecePropValueSchema<typeof googleSheetsAuth>;

      const authClient = new OAuth2Client();
      authClient.setCredentials(authValue);

      const sheets = google.sheets({ version: 'v4', auth: authClient });

      const response = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId as unknown as string,
      });

      const sheetsData = response.data.sheets ?? [];

      const options: DropdownOption<number>[] = [];

      for (const sheet of sheetsData) {
        if (sheet.properties?.title && sheet.properties?.sheetId) {
          options.push({
            label: sheet.properties.title,
            value: sheet.properties.sheetId,
          });
        }
      }

      return {
        disabled: false,
        options,
      };
    },
  });
