import { Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";

export const API_URL = "https://api.extracta.ai/api/v1";

export const batchIdDropdown = Property.Dropdown({
    displayName: 'Batch ID',
    description: 'Select a batch to add this file to. If left blank, a new batch will be created.',
    required: false,
    refreshers: ['extractionId'],
    options: async ({ auth, propsValue }) => {
        const extractionId = (propsValue as { extractionId: string }).extractionId;
        if (!auth || !extractionId) {
            return {
                disabled: true,
                options: [],
                placeholder: 'Please provide API Key and Extraction ID first.',
            };
        }
        try {
            const response = await httpClient.sendRequest<{
                extractionDetails?: { batches?: Record<string, { status: string }> };
            }>({
                method: HttpMethod.POST,
                url: `${API_URL}/viewExtraction`,
                headers: { 'Authorization': `Bearer ${auth as string}` },
                body: { extractionId: extractionId },
            });
            const batches = response.body?.extractionDetails?.batches ?? {};
            const options = Object.entries(batches).map(([batchId, details]) => ({
                label: `Batch ID: ${batchId} (Status: ${details.status})`,
                value: batchId,
            }));
            return { disabled: false, options: options };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: "Could not load batches. Check Extraction ID.",
            };
        }
    }
});


export const requiredBatchIdDropdown = {
    ...batchIdDropdown,
    description: 'Select the batch you want to get results from.',
    required: true,
};



export const fileIdDropdown = Property.Dropdown({
    displayName: 'File ID',
    description: 'Optional: Select a specific file. Requires Extraction and Batch ID to be set.',
    required: false,
    refreshers: ['extractionId', 'batchId'],
    options: async ({ auth, propsValue }) => {
        const { extractionId, batchId } = propsValue as { extractionId: string, batchId: string };
        if (!auth || !extractionId || !batchId) {
            return {
                disabled: true,
                options: [],
                placeholder: "Provide API Key, Extraction ID, and Batch ID first."
            };
        }
        try {
            const response = await httpClient.sendRequest<{
                files?: { fileId: string; fileName: string }[];
            }>({
                method: HttpMethod.POST,
                url: `${API_URL}/getBatchResults`,
                headers: { 'Authorization': `Bearer ${auth as string}` },
                body: { extractionId, batchId },
            });
            const files = response.body?.files ?? [];
            const options = files.map(file => ({
                label: `${file.fileName} (ID: ${file.fileId})`,
                value: file.fileId,
            }));
            return { disabled: false, options: options };
        } catch (error) {
            return {
                disabled: true,
                options: [],
                placeholder: "Could not load files. Check Extraction/Batch ID."
            };
        }
    }
});