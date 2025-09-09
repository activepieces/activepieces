import {
    createAction,
    Property,
    ActionContext,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertClient } from '../common/client';

const optimizeFileProps = {
    import_method: Property.StaticDropdown({
        displayName: 'Import Method',
        description: 'How to import the file for optimization',
        required: true,
        options: {
            options: [
                { label: 'File Upload', value: 'upload' },
                { label: 'File URL', value: 'url' },
            ]
        },
        defaultValue: 'upload'
    }),
    file: Property.File({
        displayName: 'File',
        description: 'File to upload and optimize (select from your device)',
        required: false,
    }),
    url: Property.ShortText({
        displayName: 'File URL',
        description: 'URL of the file to optimize',
        required: false,
    }),
    input_format: Property.StaticDropdown({
        displayName: 'Input Format',
        description: 'The current format of the file. If not set, the extension of the input file is used',
        required: false,
        options: {
            options: [
                { label: 'PDF', value: 'pdf' },
                { label: 'PNG', value: 'png' },
                { label: 'JPG', value: 'jpg' },
            ]
        }
    }),
    profile: Property.StaticDropdown({
        displayName: 'Optimization Profile',
        description: 'Optimization profile for specific target needs',
        required: false,
        defaultValue: 'web',
        options: {
            options: [
                { label: 'Web - Remove redundant data for the web', value: 'web' },
                { label: 'Print - Optimized for printing', value: 'print' },
                { label: 'Archive - Optimized for archiving purposes', value: 'archive' },
                { label: 'MRC - Optimized for scanned images', value: 'mrc' },
                { label: 'Max - Maximal size reduction', value: 'max' },
            ]
        }
    }),
    flatten_signatures: Property.Checkbox({
        displayName: 'Flatten Signatures',
        description: 'Flatten visible signatures and keep them as non-editable graphics',
        required: false,
        defaultValue: false,
    }),
    colorspace: Property.StaticDropdown({
        displayName: 'Color Space',
        description: 'Color space of raster images',
        required: false,
        options: {
            options: [
                { label: 'Unchanged', value: 'unchanged' },
                { label: 'RGB', value: 'rgb' },
                { label: 'CMYK', value: 'cmyk' },
                { label: 'Grayscale', value: 'grayscale' },
            ]
        }
    }),
    filename: Property.ShortText({
        displayName: 'Filename',
        description: 'Choose a filename (including extension) for the output file',
        required: false,
        defaultValue: 'optimized-document.pdf'
    }),
    engine: Property.StaticDropdown({
        displayName: 'Engine',
        description: 'Use a specific engine for the optimization',
        required: false,
        options: {
            options: [
                { label: '3-Heights (Default)', value: '3heights' },
                { label: 'PDFTron', value: 'pdftron' },
                { label: 'MuPDF', value: 'mupdf' },
                { label: 'ImageMagick', value: 'imagemagick' },
                { label: 'GraphicsMagick', value: 'graphicsmagick' },
                { label: 'Poppler', value: 'poppler' },
                { label: 'Chrome/Puppeteer', value: 'chrome' },
            ]
        }
    }),
    engine_version: Property.ShortText({
        displayName: 'Engine Version',
        description: 'Use a specific engine version for the optimization',
        required: false,
    }),
    timeout: Property.Number({
        displayName: 'Timeout (seconds)',
        description: 'Timeout in seconds after which the task will be cancelled',
        required: false,
    }),
    wait_for_completion: Property.Checkbox({
        displayName: 'Wait for Completion',
        description: 'Wait for the optimization to complete before returning',
        required: true,
        defaultValue: true,
    }),
} as const;

type OptimizeFileContext = ActionContext<typeof cloudconvertAuth, typeof optimizeFileProps>;

export const optimizeFile = createAction({
    name: 'optimize_file',
    displayName: 'Optimize File',
    description: 'Optimize and compress a file (PDF, PNG, JPG)',
    auth: cloudconvertAuth,
    requireAuth: true,
    props: optimizeFileProps,
    async run(context: OptimizeFileContext) {
        const { import_method, url, file, input_format, profile, flatten_signatures, colorspace, filename, engine, engine_version, timeout, wait_for_completion } = context.propsValue;

        const client = new CloudConvertClient(context.auth);

        try {
            let importTask;

            if (import_method === 'url') {
                if (!url) {
                    throw new Error('File URL is required when using URL import method');
                }
                importTask = await client.createImportTask(url, filename);
            } else if (import_method === 'upload') {
                if (!file || !file.base64) {
                    throw new Error('Please select a file to upload from your device');
                }

                // Create upload task
                const uploadTask = await client.createUploadTask(file.filename || 'uploaded-file');

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
                if (file.base64) {
                    // Convert base64 to buffer for upload
                    const buffer = Buffer.from(file.base64, 'base64');
                    const blob = new Blob([buffer], { type: file.extension ? `application/${file.extension}` : 'application/octet-stream' });
                    formData.append('file', blob, file.filename);
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

                importTask = uploadTask;
            } else {
                throw new Error('Invalid import method selected');
            }

            const optimizeBody: any = {
                input: importTask.id,
            };

            if (input_format) optimizeBody.input_format = input_format;
            if (profile) optimizeBody.profile = profile;
            if (flatten_signatures) optimizeBody.flatten_signatures = flatten_signatures;
            if (colorspace) optimizeBody.colorspace = colorspace;
            if (filename) optimizeBody.filename = filename;
            if (engine) optimizeBody.engine = engine;
            if (engine_version) optimizeBody.engine_version = engine_version;
            if (timeout) optimizeBody.timeout = timeout;

            const optimizeTask = await client.createOptimizeTask(optimizeBody);

            const exportTask = await client.createExportTask(optimizeTask.id);

            const tasks: Record<string, string> = {
                [import_method === 'url' ? 'import/url' : 'import/upload']: importTask.id,
                'optimize': optimizeTask.id,
                'export/url': exportTask.id,
            };

            const job = await client.createJob(tasks, `optimize-${Date.now()}`);

            if (wait_for_completion) {
                let attempts = 0;
                const maxAttempts = 60;

                while (attempts < maxAttempts) {
                    const currentJob = await client.getJob(job.id);

                    if (currentJob.status === 'finished') {
                        const exportTaskData = await client.getTask(exportTask.id);

                        return {
                            job: currentJob,
                            optimize_task: optimizeTask,
                            export_task: exportTaskData,
                            download_url: exportTaskData.result?.files?.[0]?.url,
                            filename: exportTaskData.result?.files?.[0]?.filename,
                            input_format,
                            profile,
                            size: exportTaskData.result?.files?.[0]?.size || 0,
                        };
                    } else if (currentJob.status === 'error') {
                        throw new Error(`Optimize job failed: ${currentJob.message || 'Unknown error'}`);
                    }

                    await new Promise(resolve => setTimeout(resolve, 5000));
                    attempts++;
                }

                throw new Error('Optimization did not complete within the timeout period');
            }

            return {
                job,
                optimize_task: optimizeTask,
                export_task: exportTask,
                input_format,
                profile,
                status: 'processing',
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`File optimization failed: ${String(error)}`);
        }
    },

    async test(context) {
        // For testing, return mock data to simulate successful file upload
        return {
            import_method: 'upload',
            file: {
                filename: 'test-sample.pdf',
                base64: 'JVBERi0xLjcKCjEgMCBvYmogCjw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+CmVuZG9iag==',
                extension: 'pdf'
            },
            profile: 'web',
            filename: 'optimized-document.pdf',
            engine: '3heights',
            wait_for_completion: true,
            message: 'Test successful - file upload simulation completed'
        };
    },
});
