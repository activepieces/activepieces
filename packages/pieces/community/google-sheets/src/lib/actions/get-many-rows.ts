import { createAction } from "@activepieces/pieces-framework";
import { areSheetIdsValid, googleSheetsAuth, googleSheetsCommon, mapRowsToHeaderNames } from "../common/common";
import { commonProps, isFirstRowHeaderProp } from "../common/props";

export const getManyRowsAction = createAction({
    name: 'get-many-rows',
    auth: googleSheetsAuth,
    displayName: 'Get All Rows',
    description: 'Get all the rows from a specific sheet.',
    audience: 'both',
    aiMetadata: {
        description:
            'Reads every row from a worksheet in a single call, optionally keyed by header names. Use when an agent needs the full contents of a sheet rather than a search or a single row; be mindful of size on large sheets. Read-only and idempotent.',
        idempotent: true,
    },
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
            rowIndex_s: first_row_headers ? 2 : undefined,
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