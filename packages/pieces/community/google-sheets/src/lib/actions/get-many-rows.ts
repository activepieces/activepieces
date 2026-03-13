import { createAction } from "@activepieces/pieces-framework";
import { areSheetIdsValid, googleSheetsAuth, googleSheetsCommon, mapRowsToHeaderNames } from "../common/common";
import { commonProps, isFirstRowHeaderProp } from "../common/props";

export const getManyRowsAction = createAction({
    name: 'get-many-rows',
    auth: googleSheetsAuth,
    displayName: 'Get All Rows',
    description: 'Get all the rows from a specific sheet.',
    props: {
        ...commonProps,
        first_row_headers: isFirstRowHeaderProp()
    },
    async run(context) { 
        const {first_row_headers,sheetId,spreadsheetId} = context.propsValue;

        if (!areSheetIdsValid(spreadsheetId, sheetId)) {
                    throw new Error('Please select a spreadsheet and sheet first.');
                }
        const rows = await googleSheetsCommon.getGoogleSheetRows({
            auth:context.auth,
            sheetId: sheetId as number,
            spreadsheetId: spreadsheetId as string,
            rowIndex_s:undefined,
            rowIndex_e:undefined,
            headerRow: 1,
          });

        const useHeaderNames = first_row_headers;

        const result = await mapRowsToHeaderNames(
            rows,
            useHeaderNames,
            spreadsheetId as string,
            sheetId as number,
            1,
            context.auth
        )

        return result
    }
})