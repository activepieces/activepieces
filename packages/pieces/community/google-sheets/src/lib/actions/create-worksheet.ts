import { createAction, Property } from '@activepieces/pieces-framework';
import { createGoogleClient } from '../common/common';
import { googleSheetsAuth } from '../common/common';
import { includeTeamDrivesProp, spreadsheetIdProp } from '../common/props';
import { google } from 'googleapis';

export const createWorksheetAction = createAction({
  auth: googleSheetsAuth,
  name: 'create-worksheet',
  displayName: 'Create Worksheet',
  description:'Create a blank worksheet with a title.',
  props: {
    includeTeamDrives: includeTeamDrivesProp(),
    spreadsheetId: spreadsheetIdProp('Spreadsheet',''),
    title:Property.ShortText({
        displayName:'Title',
        description:'The title of the new worksheet.',
        required:true
    }),
    headers:Property.Array({
        displayName:'Headers',
        required:false
    })
   
  },
  async run(context){
    const {spreadsheetId,title} = context.propsValue;
    const headers = context.propsValue.headers as string[] ?? [];
	const client = await createGoogleClient(context.auth);
    const sheetsApi = google.sheets({ version: 'v4', auth: client });
    const sheet = await sheetsApi.spreadsheets.batchUpdate({
        spreadsheetId:spreadsheetId,
        requestBody:{
            requests:[
                {
                    addSheet:{
                        properties:{
                            title:title
                        },
                    },
                    
                }
            ]
        }
    });
    const addHeadersResponse = await sheetsApi.spreadsheets.values.append({
        spreadsheetId,
        range:`${context.propsValue.title}!A1`,
        valueInputOption:'RAW',
        requestBody:{
            majorDimension:'ROWS',
            values:[headers]
        }
    });

    return {
        id: sheet.data?.replies?.[0]?.addSheet?.properties?.sheetId,
        ...addHeadersResponse.data
    }
    

  }})