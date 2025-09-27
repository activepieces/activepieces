import {
    OAuth2PropertyValue,
    Property,
    createTrigger,
} from '@activepieces/pieces-framework';
import { TriggerStrategy } from '@activepieces/pieces-framework';
import { excelCommon } from '../common/common';
import { excelAuth } from '../..';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

// Define a type for the worksheet object for clarity
interface Worksheet {
    id: string;
    name: string;
    position: number;
    visibility: string;
}

// Helper function to fetch all worksheets for a given workbook
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

export const newWorksheetTrigger = createTrigger({
    auth: excelAuth,
    name: 'new_worksheet',
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
        // Fetch the initial list of worksheets and store their IDs as the baseline.
        // This prevents the trigger from firing for all existing worksheets upon activation.
        const worksheets = await getWorksheets(context.auth, context.propsValue.workbook_id);
        const worksheetIds = worksheets.map(ws => ws.id);
        
        await context.store.put(`worksheet_ids`, worksheetIds);
    },

    onDisable: async (context) => {
        // Clear the stored state when the trigger is disabled.
        await context.store.delete(`worksheet_ids`);
    },

    run: async (context) => {
        // Retrieve the list of worksheet IDs from the last run.
        const oldWorksheetIds = await context.store.get<string[]>(`worksheet_ids`) ?? [];
        
        // Fetch the current list of worksheets.
        const currentWorksheets = await getWorksheets(context.auth, context.propsValue.workbook_id);
        const currentWorksheetIds = currentWorksheets.map(ws => ws.id);
        
        // Find worksheets that are in the current list but not in the old list.
        const newWorksheets = currentWorksheets.filter(ws => !oldWorksheetIds.includes(ws.id));
        
        // If new worksheets are found, update the store with the complete new list for the next run.
        if (newWorksheets.length > 0) {
            await context.store.put(`worksheet_ids`, currentWorksheetIds);
        }
        
        // Return the array of newly created worksheets.
        return newWorksheets;
    },

    test: async (context) => {
        // For testing purposes, fetch all worksheets and return the last one as a sample.
        const worksheets = await getWorksheets(context.auth, context.propsValue.workbook_id);
        return worksheets.slice(-1);
    },
});