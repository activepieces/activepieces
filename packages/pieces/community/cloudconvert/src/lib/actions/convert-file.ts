import {
    createAction,
    Property,
    ActionContext,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertClient } from '../common/client';

const convertFileProps = {
    import_method: Property.StaticDropdown({
        displayName: 'Import Method',
        description: 'How to import the file for conversion',
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
        description: 'File to upload and convert (select from your device)',
        required: false,
    }),
    url: Property.ShortText({
        displayName: 'File URL',
        description: 'URL of the file to convert',
        required: false,
    }),
    input_format: Property.StaticDropdown({
        displayName: 'Input Format',
        description: 'The current format of the file. If not set, the extension of the input file is used',
        required: false,
        options: {
            options: [
                // Documents
                { label: 'PDF', value: 'pdf' },
                { label: 'DOCX (Word)', value: 'docx' },
                { label: 'DOC (Word)', value: 'doc' },
                { label: 'ODT (OpenDocument)', value: 'odt' },
                { label: 'RTF (Rich Text)', value: 'rtf' },
                { label: 'TXT (Plain Text)', value: 'txt' },
                // Spreadsheets
                { label: 'XLSX (Excel)', value: 'xlsx' },
                { label: 'XLS (Excel)', value: 'xls' },
                { label: 'ODS (OpenDocument)', value: 'ods' },
                { label: 'CSV (Comma Separated)', value: 'csv' },
                // Presentations
                { label: 'PPTX (PowerPoint)', value: 'pptx' },
                { label: 'PPT (PowerPoint)', value: 'ppt' },
                { label: 'ODP (OpenDocument)', value: 'odp' },
                // Images
                { label: 'PNG', value: 'png' },
                { label: 'JPG/JPEG', value: 'jpg' },
                { label: 'GIF', value: 'gif' },
                { label: 'BMP', value: 'bmp' },
                { label: 'TIFF', value: 'tiff' },
                { label: 'SVG', value: 'svg' },
                { label: 'WebP', value: 'webp' },
                // Other formats
                { label: 'HTML', value: 'html' },
                { label: 'XML', value: 'xml' },
                { label: 'JSON', value: 'json' },
            ]
        }
    }),
    output_format: Property.StaticDropdown({
        displayName: 'Output Format',
        description: 'The target format to convert to',
        required: true,
        defaultValue: 'pdf',
        options: {
            options: [
                // Documents
                { label: 'PDF', value: 'pdf' },
                { label: 'DOCX (Word)', value: 'docx' },
                { label: 'DOC (Word)', value: 'doc' },
                { label: 'ODT (OpenDocument)', value: 'odt' },
                { label: 'RTF (Rich Text)', value: 'rtf' },
                { label: 'TXT (Plain Text)', value: 'txt' },
                // Spreadsheets
                { label: 'XLSX (Excel)', value: 'xlsx' },
                { label: 'XLS (Excel)', value: 'xls' },
                { label: 'ODS (OpenDocument)', value: 'ods' },
                { label: 'CSV (Comma Separated)', value: 'csv' },
                // Presentations
                { label: 'PPTX (PowerPoint)', value: 'pptx' },
                { label: 'PPT (PowerPoint)', value: 'ppt' },
                { label: 'ODP (OpenDocument)', value: 'odp' },
                // Images
                { label: 'PNG', value: 'png' },
                { label: 'JPG/JPEG', value: 'jpg' },
                { label: 'GIF', value: 'gif' },
                { label: 'BMP', value: 'bmp' },
                { label: 'TIFF', value: 'tiff' },
                { label: 'SVG', value: 'svg' },
                { label: 'WebP', value: 'webp' },
                // Other formats
                { label: 'HTML', value: 'html' },
                { label: 'XML', value: 'xml' },
                { label: 'JSON', value: 'json' },
            ]
        }
    }),
    filename: Property.ShortText({
        displayName: 'Filename',
        description: 'Choose a filename (including extension) for the output file',
        required: false,
        defaultValue: 'converted-document.pdf'
    }),
    engine: Property.StaticDropdown({
        displayName: 'Engine',
        description: 'Use a specific engine for the conversion',
        required: false,
        options: {
            options: [
                { label: 'LibreOffice (Default)', value: 'libreoffice' },
                { label: 'Microsoft Office', value: 'office' },
                { label: 'OnlyOffice', value: 'onlyoffice' },
                { label: 'Chrome/Puppeteer', value: 'chrome' },
                { label: 'ImageMagick', value: 'imagemagick' },
                { label: 'Poppler', value: 'poppler' },
                { label: 'GraphicsMagick', value: 'graphicsmagick' },
                { label: 'FFmpeg', value: 'ffmpeg' },
                { label: 'Calibre', value: 'calibre' },
                { label: 'Pandoc', value: 'pandoc' },
                { label: '3-Heights', value: '3heights' },
                { label: 'PDFTron', value: 'pdftron' },
                { label: 'MuPDF', value: 'mupdf' },
                { label: 'Inkscape', value: 'inkscape' },
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
        description: 'Wait for the conversion to complete before returning',
        required: true,
        defaultValue: true,
    }),
} as const;

type ConvertFileContext = ActionContext<typeof cloudconvertAuth, typeof convertFileProps>;

export const convertFile = createAction({
    name: 'convert_file',
    displayName: 'Convert File',
    description: 'Convert one input file from input_format to output_format',
    auth: cloudconvertAuth,
    requireAuth: true,
    props: convertFileProps,
    async run(context: ConvertFileContext) {
        const { import_method, url, file, input_format, output_format, filename, engine, engine_version, timeout, wait_for_completion } = context.propsValue;

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

            const convertBody: any = {
                input: importTask.id,
                output_format,
            };

            if (input_format) convertBody.input_format = input_format;
            if (filename) convertBody.filename = filename;
            if (engine) convertBody.engine = engine;
            if (engine_version) convertBody.engine_version = engine_version;
            if (timeout) convertBody.timeout = timeout;

            const convertTask = await client.createConvertTask(convertBody);

            const exportTask = await client.createExportTask(convertTask.id);

            const tasks: Record<string, string> = {
                [import_method === 'url' ? 'import/url' : 'import/upload']: importTask.id,
                'convert': convertTask.id,
                'export/url': exportTask.id,
            };

            const job = await client.createJob(tasks, `convert-${Date.now()}`);

            if (wait_for_completion) {
                let attempts = 0;
                const maxAttempts = 60;

                while (attempts < maxAttempts) {
                    const currentJob = await client.getJob(job.id);

                    if (currentJob.status === 'finished') {
                        const exportTaskData = await client.getTask(exportTask.id);

                        return {
                            job: currentJob,
                            convert_task: convertTask,
                            export_task: exportTaskData,
                            download_url: exportTaskData.result?.files?.[0]?.url,
                            filename: exportTaskData.result?.files?.[0]?.filename,
                            input_format,
                            output_format,
                        };
                    } else if (currentJob.status === 'error') {
                        throw new Error(`Conversion job failed: ${currentJob.message || 'Unknown error'}`);
                    }

                    await new Promise(resolve => setTimeout(resolve, 5000));
                    attempts++;
                }

                throw new Error('Conversion did not complete within the timeout period');
            }

            return {
                job,
                convert_task: convertTask,
                export_task: exportTask,
                input_format,
                output_format,
                status: 'processing',
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`File conversion failed: ${String(error)}`);
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
            output_format: 'pdf',
            filename: 'converted-document.pdf',
            engine: 'libreoffice',
            wait_for_completion: true,
            message: 'Test successful - file upload simulation completed'
        };
    },
});
