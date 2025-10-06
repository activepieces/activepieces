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

type NewDocumentProcessedProps = StaticPropsValue<typeof props>;

const props = {
    classificationId: Property.ShortText({
        displayName: 'Classification ID',
        description: 'The ID of the classification process to monitor.',
        required: true,
    }),
    batchId: {
        ...requiredBatchIdDropdown,
        displayName: 'Batch ID',
        description: 'The batch to monitor for processed files. You must select a batch.',
        refreshers: ['classificationId'], 
    },
    fileId: {
        ...fileIdDropdown,
        displayName: 'Specific File ID (Optional)',
        description: 'Only trigger for this specific file in the batch. Leave blank to check all files in the batch.',
        refreshers: ['classificationId', 'batchId'],
    }
};

type GetResultsResponse = {
    status: string;
    files: {
        fileId: string;
        fileName: string;
        status: string;
        result?: unknown;
        extraction?: { extractionId: string; batchId: string; fileId: string };
        url: string;
    }[];
}

const polling: Polling<string, NewDocumentProcessedProps> = {
    strategy: DedupeStrategy.TIMEBASED, 
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const { classificationId, batchId, fileId } = propsValue as NewDocumentProcessedProps;
        
        const requestBody: Record<string, string | undefined> = {
            classificationId: classificationId,
            batchId: batchId as string, 
        };

        if (fileId) {
            requestBody['fileId'] = fileId; 
        }

        try {
            const response = await httpClient.sendRequest<GetResultsResponse>({
                method: HttpMethod.POST,
                url: `${API_URL}/documentClassification/getResults`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token: auth as string,
                },
                body: requestBody,
            });

            const processedFiles = response.body.files
                .filter(file => file.status === 'processed')
                .map(file => ({
                    epochMilliSeconds: Date.now(),
                    data: file,
                }));
            
            return processedFiles;

        } catch (error) {
            console.error("Error fetching classification results:", error);
            throw new Error(`Failed to retrieve classification results: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    },
};

export const newDocumentProcessed = createTrigger({
    auth: extractaAIAuth,
    name: 'new_document_processed',
    displayName: 'New Document Processed (Classification)',
    description: 'Fires when a document in a classification batch has been successfully processed.',
    props,
    sampleData: {
        "fileId": "fileId1",
        "fileName": "File 2.pdf",
        "status": "processed",
        "result": {
            "confidence": 0.95,
            "documentType": "resume"
        },
        "extraction": {
            "extractionId": "extractionId",
            "batchId": "batchId",
            "fileId": "fileId"
        },
        "url": "fileUrl"
    },
    type: TriggerStrategy.POLLING,
    
    // Polling Helper methods
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