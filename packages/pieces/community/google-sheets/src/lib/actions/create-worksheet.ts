import { createAction, Property } from '@activepieces/pieces-framework';
import { createGoogleSheetClient } from '../common/common';
import { googleSheetsOAuth2, googleSheetsServiceAccountAuth } from '../..';
import { includeTeamDrivesProp, spreadsheetIdProp } from '../common/props';
const auth = [googleSheetsOAuth2, googleSheetsServiceAccountAuth];
export const createWorksheetAction = createAction({
  auth,
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
	  const googleSheetClient = await createGoogleSheetClient(context.auth);

    const sheet = await googleSheetClient.spreadsheets.batchUpdate({
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
    const addHeadersResponse = await googleSheetClient.spreadsheets.values.append({
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
  
  