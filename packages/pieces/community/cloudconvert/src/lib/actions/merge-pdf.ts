import {
    createAction,
    Property,
    ActionContext,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertClient } from '../common/client';

const mergePdfProps = {
    import_method: Property.StaticDropdown({
        displayName: 'Import Method',
        description: 'How to import the files for merging',
        required: true,
        options: {
            options: [
                { label: 'File Upload', value: 'upload' },
                { label: 'File URL', value: 'url' },
            ]
        },
        defaultValue: 'upload'
    }),
    files: Property.Array({
        displayName: 'Files to Merge',
        description: 'List of files to merge into a single PDF',
        required: true,
        properties: {
            url: Property.ShortText({
                displayName: 'File URL',
                description: 'URL of the file to merge',
                required: false,
            }),
            file: Property.File({
                displayName: 'File',
                description: 'File to upload and merge',
                required: false,
            }),
            filename: Property.ShortText({
                displayName: 'Filename in PDF',
                description: 'Optional filename for this file within the PDF',
                required: false,
            })
        }
    }),
    filename: Property.ShortText({
        displayName: 'Output Filename',
        description: 'Choose a filename (including extension) for the output file',
        required: false,
    }),
    engine: Property.StaticDropdown({
        displayName: 'Engine',
        description: 'Use a specific engine for the conversion',
        required: false,
        options: {
            options: [
                { label: '3-Heights (Default)', value: '3heights' },
                { label: 'PDFTron', value: 'pdftron' },
                { label: 'MuPDF', value: 'mupdf' },
                { label: 'Poppler', value: 'poppler' },
                { label: 'LibreOffice', value: 'libreoffice' },
            ]
        }
    }),
    engine_version: Property.ShortText({
        displayName: 'Engine Version',
        description: 'Use a specific engine version for the conversion',
        required: false,
    }),
    timeout: Property.Number({
        displayName: 'Timeout (seconds)',
        description: 'Timeout in seconds after which the task will be cancelled',
        required: false,
    }),
    wait_for_completion: Property.Checkbox({
        displayName: 'Wait for Completion',
        description: 'Wait for the merge to complete before returning',
        required: true,
        defaultValue: true,
    }),
} as const;

type MergePdfContext = ActionContext<typeof cloudconvertAuth, typeof mergePdfProps>;

export const mergePdf = createAction({
    name: 'merge_pdf',
    displayName: 'Merge to PDF',
    description: 'Merge multiple files into a single PDF',
    auth: cloudconvertAuth,
    requireAuth: true,
    props: mergePdfProps,
    async run(context: MergePdfContext) {
        const { import_method, files, filename, engine, engine_version, timeout, wait_for_completion } = context.propsValue;

        if (!files || files.length < 2) {
            throw new Error('At least 2 files are required for merging');
        }

        const client = new CloudConvertClient(context.auth);

        try {
            const importTasks: string[] = [];

            if (import_method === 'url') {
                // Handle URL import method
                for (const file of files as Array<{ url: string; filename?: string }>) {
                    if (!file.url) {
                        throw new Error('File URL is required when using URL import method');
                    }
                    const importTask = await client.createImportTask(file.url, file.filename);
                    importTasks.push(importTask.id);
                }
            } else if (import_method === 'upload') {
                // Handle file upload method
                for (const file of files as Array<{ file?: any; filename?: string }>) {
                    if (!file.file || !file.file.base64) {
                        throw new Error('Please select a file to upload from your device');
                    }

                    // Create upload task for each file
                    const uploadTask = await client.createUploadTask(file.file.filename || 'uploaded-file');

                    // Get upload URL and parameters
                    const uploadUrl = uploadTask.result.form.url;
                    const uploadForm = uploadTask.result.form.parameters;

                    // Prepare form data for upload
                    const formData = new FormData();

                    // Add form parameters
                    Object.entries(uploadForm).forEach(([key, value]) => {
                        formData.append(key, value as string);
                    });

                    // Add the file
                    if (file.file.base64) {
                        // Convert base64 to buffer for upload
                        const buffer = Buffer.from(file.file.base64, 'base64');
                        const blob = new Blob([buffer], { type: file.file.extension ? `application/${file.file.extension}` : 'application/octet-stream' });
                        formData.append('file', blob, file.file.filename);
                    }

                    // Upload the file
                    const uploadResponse = await httpClient.sendRequest({
                        method: HttpMethod.POST,
                        url: uploadUrl,
                        body: formData,
                    });

                    if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
                        throw new Error(`Failed to upload file: HTTP ${uploadResponse.status} - ${uploadResponse.body?.message || 'Upload failed'}`);
                    }

                    importTasks.push(uploadTask.id);
                }
            } else {
                throw new Error('Invalid import method selected');
            }

            const mergeBody: any = {
                input: importTasks.length === 1 ? importTasks[0] : importTasks,
                output_format: 'pdf',
            };

            if (filename) mergeBody.filename = filename;
            if (engine) mergeBody.engine = engine;
            if (engine_version) mergeBody.engine_version = engine_version;
            if (timeout) mergeBody.timeout = timeout;

            const mergeTask = await client.createMergeTask(mergeBody);

            const exportTask = await client.createExportTask(mergeTask.id);

            const tasks: Record<string, string> = {};
            importTasks.forEach((taskId, index) => {
                tasks[import_method === 'url' ? `import/url-${index + 1}` : `import/upload-${index + 1}`] = taskId;
            });
            tasks['merge'] = mergeTask.id;
            tasks['export/url'] = exportTask.id;

            const job = await client.createJob(tasks, `merge-${Date.now()}`);

            if (wait_for_completion) {
                let attempts = 0;
                const maxAttempts = 60;

                while (attempts < maxAttempts) {
                    const currentJob = await client.getJob(job.id);

                    if (currentJob.status === 'finished') {
                        const exportTaskData = await client.getTask(exportTask.id);

                        return {
                            job: currentJob,
                            merge_task: mergeTask,
                            export_task: exportTaskData,
                            download_url: exportTaskData.result?.files?.[0]?.url,
                            filename: exportTaskData.result?.files?.[0]?.filename,
                            file_count: files.length,
                            output_format: 'pdf',
                        };
                    } else if (currentJob.status === 'error') {
                        throw new Error(`Merge job failed: ${currentJob.message || 'Unknown error'}`);
                    }

                    await new Promise(resolve => setTimeout(resolve, 5000));
                    attempts++;
                }

                throw new Error('Merge did not complete within the timeout period');
            }

            return {
                job,
                merge_task: mergeTask,
                export_task: exportTask,
                file_count: files.length,
                output_format: 'pdf',
                status: 'processing',
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Merge failed: ${String(error)}`);
        }
    },

    async test(context) {
        // For testing, return mock data to simulate successful file upload
        return {
            import_method: 'upload',
            files: [
                {
                    file: {
                        filename: 'test-sample1.pdf',
                        base64: 'JVBERi0xLjcKCjEgMCBvYmogCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+CmVuZG9iag==',
                        extension: 'pdf'
                    },
                    filename: 'document1.pdf'
                },
                {
                    file: {
                        filename: 'test-sample2.pdf',
                        base64: 'JVBERi0xLjcKCjEgMCBvYmogCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+CmVuZG9iag==',
                        extension: 'pdf'
                    },
                    filename: 'document2.pdf'
                }
            ],
            filename: 'merged-document.pdf',
            engine: '3heights',
            wait_for_completion: true,
            message: 'Test successful - file merge simulation completed'
        };
    },
});
