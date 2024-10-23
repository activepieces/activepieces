import { createAction, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../..';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const createSpreadsheetAction = createAction({
  auth: googleSheetsAuth,
  name: 'create-spreadsheet',
  displayName: 'Create Spreadsheet',
  description:'Creates a blank spreadsheet.',
  props: {
    title:Property.ShortText({
        displayName:'Title',
        description:'The title of the new spreadsheet.',
        required:true
    }),
    // spreadsheet_id: googleSheetsCommon.spreadsheet_id(false,'Spreadsheet to Copy'),
    include_team_drives: googleSheetsCommon.include_team_drives,
   
  },
  async run(context){
    const title = context.propsValue.title;

    const response = await createSpreadsheet(context.auth,title)
    const newSpreadsheetId = response.data.spreadsheetId
    
  return{
    id:newSpreadsheetId
  }
  }})


async function copyFile(auth:PiecePropValueSchema<typeof googleSheetsAuth>,title:string,fileId?:string)
{
    const authClient = new OAuth2Client();
	authClient.setCredentials(auth);

    const drive = google.drive({ version: 'v3', auth: authClient });

        return await drive.files.copy({
            fileId,
            fields:'*',
            supportsAllDrives:true,
            requestBody:{
                name:title
            }
        })
    }  


async function createSpreadsheet(auth:PiecePropValueSchema<typeof googleSheetsAuth>,title:string) {
    const authClient = new OAuth2Client();
	authClient.setCredentials(auth);

    const sheets = google.sheets({ version: 'v4', auth: authClient });

    return await sheets.spreadsheets.create({
        requestBody:{
            properties:{
                title
            }
        }
    })
}