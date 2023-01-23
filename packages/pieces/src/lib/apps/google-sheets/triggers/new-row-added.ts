
import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { googleSheetsCommon } from '../common/common';

export const newRowAdded = createTrigger({
  name: 'new_row_added',
  displayName: 'New Row',
  description: 'Triggers when there is a new row added',
  props: {
    authentication: googleSheetsCommon.authentication,
    spreadsheet_id: googleSheetsCommon.spreadsheet_id,
    sheet_id: googleSheetsCommon.sheet_id
  },
  type: TriggerStrategy.POLLING,
  async onEnable(context) {
    const sheetId = context.propsValue['sheet_id']!;
    const accessToken = context.propsValue['authentication']!['access_token'];
    const spreadSheetId = context.propsValue['spreadsheet_id']!;
    let currentValues = await googleSheetsCommon.getValues(spreadSheetId, accessToken, sheetId);
    console.log(`The spreadsheet ${spreadSheetId} spstarted with ${currentValues.length} rows`);
    context.store?.put("rowCount", currentValues.length);
  },
  async onDisable(context) {},
  async run(context) {
    const sheetId = context.propsValue['sheet_id']!;
    const accessToken = context.propsValue['authentication']!['access_token'];
    const spreadSheetId = context.propsValue['spreadsheet_id']!;
    let rowCount = (await context.store?.get<number>("rowCount"))??0;
    let currentValues = await googleSheetsCommon.getValues(spreadSheetId, accessToken, sheetId)
    let payloads: any[] = [];
    if(currentValues.length > rowCount){
      payloads = currentValues.slice(rowCount);
    }
    context.store?.put("rowCount", currentValues.length);
    return payloads;
  },
});

