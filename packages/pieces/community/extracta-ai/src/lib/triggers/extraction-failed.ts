import {
    createTrigger,
    TriggerStrategy,
    Property,
    StaticPropsValue,
} from '@activepieces/pieces-framework';
import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
    httpClient,
    AuthenticationType,
} from '@activepieces/pieces-common';
import { extractaAIAuth } from '../../index';
import { requiredBatchIdDropdown, API_URL, fileIdDropdown } from '../common/index'; 


const props = {
    extractionId: Property.ShortText({
        displayName: 'Extraction ID',
        description: 'The ID of the extraction process to monitor.',
        required: true,
    }),
    batchId: {
        ...requiredBatchIdDropdown,
        displayName: 'Batch ID',
        description: 'The batch to monitor for failed files. You must select a batch.',
        refreshers: ['extractionId'],
    },
    fileId: {
        ...fileIdDropdown,
        displayName: 'Specific File ID (Optional)',
        description: 'Only trigger for this specific file in the batch. Leave blank to check all files in the batch.',
        refreshers: ['extractionId', 'batchId'],
    }
};


type ExtractionFailedProps = StaticPropsValue<typeof props>;


type GetBatchResultsResponse = {
    extractionId: string;
    batchId: string;
    files: {
        fileId: string;
        fileName: string;
        status: string;
        result?: unknown;
        url: string;
    }[];
}


const polling: Polling<string, ExtractionFailedProps> = {
   
    strategy: DedupeStrategy.TIMEBASED, 
    
    items: async ({ auth, propsValue }) => {
        const { extractionId, batchId, fileId } = propsValue as ExtractionFailedProps;
        
        
        const requestBody: Record<string, string> = {
            extractionId: extractionId,
            batchId: batchId as string, 
        };

        if (fileId) {
            requestBody['fileId'] = fileId;
        }

        if (!extractionId || !batchId) {
             throw new Error("Extraction ID and Batch ID are required.");
        }

        try {
            const response = await httpClient.sendRequest<GetBatchResultsResponse>({
                method: HttpMethod.POST,
                url: `${API_URL}/getBatchResults`, 
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: auth as string,
                },
                body: requestBody,
            });

            const failedFiles = response.body.files
                .filter(file => file.status === 'failed') 
                .map(file => ({
                    
                    epochMilliSeconds: Date.now(),
                    data: file,
                }));
            
            return failedFiles;

        } catch (error) {
            console.error("Error fetching batch results for failed files:", error);
            throw new Error(`Failed to retrieve batch results: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    },
};

export const extractionFailed = createTrigger({
    auth: extractaAIAuth,
    name: 'extraction_failed',
    displayName: 'Extraction Failed',
    description: 'Fires when a document extraction process has failed for a file.',
    props,
    sampleData: {
        "fileId": "fileId_failed",
        "fileName": "Document_With_Error.pdf",
        "status": "failed",
        "result": null,
        "url": "fileUrl"
    },
    type: TriggerStrategy.POLLING,
    
    
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, context);
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, context);
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});