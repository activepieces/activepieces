import {
    OAuth2PropertyValue,
    Property,
    createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { excelAuth } from '../..';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';


interface Worksheet {
    id: string;
    name: string;
    position: number;
    visibility: string;
}


async function getWorksheets(auth: OAuth2PropertyValue, workbookId: string): Promise<Worksheet[]> {
    if (!workbookId) return [];
    
    const response = await httpClient.sendRequest<{ value: Worksheet[] }>({
        method: HttpMethod.GET,
        url: `${excelCommon.baseUrl}/items/${workbookId}/workbook/worksheets`,
        authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth.access_token,
        },
    });
    return response.body.value ?? [];
}

export const newWorksheet = createTrigger({
    auth: excelAuth,
    name: 'newWorksheet',
    displayName: 'New Worksheet',
    description: 'Fires when a new worksheet is created in a workbook.',
    props: {
        workbook_id: excelCommon.workbook_id,
    },
    type: TriggerStrategy.POLLING,
    sampleData: {
        "@odata.id": "/workbook/worksheets(%27%7B00000000-0001-0000-0100-000000000000%7D%27)",
        "id": "{00000000-0001-0000-0100-000000000000}",
        "name": "Sheet2",
        "position": 1,
        "visibility": "Visible"
    },
    
    onEnable: async (context) => {

        const worksheets = await getWorksheets(context.auth, context.propsValue.workbook_id);
        const worksheetIds = worksheets.map(ws => ws.id);
        
        await context.store.put(`worksheet_ids`, worksheetIds);
    },

    onDisable: async (context) => {
        await context.store.delete(`worksheet_ids`);
    },

    run: async (context) => {

        const oldWorksheetIds = await context.store.get<string[]>(`worksheet_ids`) ?? [];
        

        const currentWorksheets = await getWorksheets(context.auth, context.propsValue.workbook_id);
        

        const newWorksheets = currentWorksheets.filter(ws => !oldWorksheetIds.includes(ws.id));
        

        if (newWorksheets.length > 0) {
            const currentWorksheetIds = currentWorksheets.map(ws => ws.id);
            await context.store.put(`worksheet_ids`, currentWorksheetIds);
        }
        

        return newWorksheets;
    },

    test: async (context) => {
        const worksheets = await getWorksheets(context.auth, context.propsValue.workbook_id);
        return worksheets.slice(-1);
    },
});