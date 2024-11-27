import { createAction, Property } from '@activepieces/pieces-framework';
import { createGoogleSheetClient, googleSheetsCommon } from '../common/common';
import { googleSheetsAuth } from '../..';

export const createWorksheetAction = createAction({
  auth: googleSheetsAuth,
  name: 'create-worksheet',
  displayName: 'Create Worksheet',
  description:'Create a blank worksheet with a title.',
  props: {
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    include_team_drives: googleSheetsCommon.include_team_drives,
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
    const headers = context.propsValue.headers as string[] ?? [];
	const googleSheetClient = await createGoogleSheetClient(context.auth);

    const sheet = await googleSheetClient.spreadsheets.batchUpdate({
        spreadsheetId:context.propsValue.spreadsheet_id,
        requestBody:{
            requests:[
                {
                    addSheet:{
                        properties:{
                            title:context.propsValue.title
                        },
                    },
                    
                }
            ]
        }
    });
    const addHeadersResponse = await googleSheetClient.spreadsheets.values.append({
        spreadsheetId:context.propsValue.spreadsheet_id,
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