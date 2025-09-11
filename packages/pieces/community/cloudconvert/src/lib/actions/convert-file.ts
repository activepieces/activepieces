import { createAction } from '@activepieces/pieces-framework';
import { propsValidation, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth, CloudConvertClient, convertFileProps, convertFileSchema } from '../common';

// Get the props function result
const getConvertFileProps = convertFileProps;

export const convertFile = createAction({
    name: 'convert_file',
    displayName: 'Convert File',
    description: 'Create a basic file conversion task for a single file with desired output format',
    auth: cloudconvertAuth,
    requireAuth: true,
    props: getConvertFileProps(),
    async run(context) {
        await convertFileSchema.parseAsync(context.propsValue);

        const { import_method, url, file, stored_file_id, input_format, output_format, filename, engine, engine_version, timeout, wait_for_completion, store_file } = context.propsValue;

        const client = new CloudConvertClient(context.auth);

        try {
            const supportedFormats = await client.getSupportedFormats({
                inputFormat: input_format === 'auto' ? undefined : input_format,
                outputFormat: output_format,
                include: ['options', 'engine_versions']
            });
            
            if (supportedFormats.length === 0) {
                const allOutputFormats = await client.getSupportedFormats({
                    outputFormat: output_format,
                    include: ['options', 'engine_versions']
                });
                
                throw new Error(`Conversion from ${input_format || 'auto-detected format'} to ${output_format} is not supported by CloudConvert. Available input formats for ${output_format}: ${allOutputFormats.map((f: any) => f.input_format).join(', ')}`);
            }
            
            const engines = [...new Set(supportedFormats.map((f: any) => f.engine))];

            const jobTasks: Record<string, any> = {};

            if (import_method === 'url') {
                if (!url) {
                    throw new Error('File URL is required when using URL import method');
                }
                jobTasks['import-file'] = {
                    operation: 'import/url',
                    url: url,
                    ...(filename && { filename })
                };
            } else if (import_method === 'stored_file') {
                if (!stored_file_id) {
                    throw new Error('Stored File ID is required when using stored file import method');
                }
                if (!context.server?.apiUrl) {
                    throw new Error('Server API URL is not available. Please check your Activepieces server configuration.');
                }
                const baseUrl = context.server.apiUrl.replace(/\/$/, '');
                const fileUrl = `${baseUrl}/v1/step-files/${stored_file_id}`;

                try {
                    new URL(fileUrl);
                } catch (urlError) {
                    throw new Error(`Invalid file URL constructed: ${fileUrl}. URL Error: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
                }
                jobTasks['import-file'] = {
                    operation: 'import/url',
                    url: fileUrl,
                    ...(filename && { filename })
                };
            } else if (import_method === 'upload') {
                if (!file || !file.base64) {
                    throw new Error('Please select a file to upload from your device');
                }
                const uploadTask = await client.createUploadTask(file.filename || 'uploaded-file');

                const uploadUrl = uploadTask.result.form.url;
                const uploadForm = uploadTask.result.form.parameters;

                const formData = new FormData();

                Object.entries(uploadForm).forEach(([key, value]) => {
                    formData.append(key, value as string);
                });

                if (file.base64) {
                    const buffer = Buffer.from(file.base64, 'base64');
                    const blob = new Blob([buffer], { type: file.extension ? `application/${file.extension}` : 'application/octet-stream' });
                    formData.append('file', blob, file.filename);
                }

                const uploadResponse = await httpClient.sendRequest({
                    method: HttpMethod.POST,
                    url: uploadUrl,
                    body: formData,
                });

                if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
                    throw new Error(`Failed to upload file: HTTP ${uploadResponse.status} - ${uploadResponse.body?.message || 'Upload failed'}`);
                }

                jobTasks['import-file'] = {
                    operation: 'import/upload',
                    ...(filename && { filename })
                };
            } else {
                throw new Error('Invalid import method selected');
            }

            const convertOptions: any = {
                input: 'import-file',
                output_format,
            };

            if (input_format && input_format !== 'auto') {
                convertOptions.input_format = input_format;
            }

            if (filename) {
                convertOptions.filename = filename;
            }

            if (engine) {
                if (!engines.includes(engine)) {
                    convertOptions.engine = engines[0];
                } else {
                    convertOptions.engine = engine;
                }
            } else if (engines.length > 0) {
                convertOptions.engine = engines[0];
            }
            
            if (engine_version) convertOptions.engine_version = engine_version;
            if (timeout) convertOptions.timeout = timeout;

            jobTasks['convert-file'] = {
                operation: 'convert',
                ...convertOptions
            };

            jobTasks['export-file'] = {
                operation: 'export/url',
                input: 'convert-file'
            };

            const job = await client.createJob(jobTasks, `convert-${Date.now()}`);

            if (wait_for_completion) {
                let attempts = 0;
                const maxAttempts = 60;

                while (attempts < maxAttempts) {
                    const currentJob = await client.getJob(job.id);

                    if (currentJob.status === 'finished') {
                        const exportTaskData = currentJob.tasks?.find((task: any) => task.name === 'export-file');
                        const downloadUrl = exportTaskData?.result?.files?.[0]?.url;
                        const outputFilename = exportTaskData?.result?.files?.[0]?.filename || `converted-${output_format}`;

                        let storedFileId: string | undefined;
                        if (store_file && downloadUrl) {
                            try {
                                if (!downloadUrl || typeof downloadUrl !== 'string') {
                                    throw new Error(`Invalid download URL: ${downloadUrl}`);
                                }
                                
                                try {
                                    new URL(downloadUrl);
                                } catch (urlError) {
                                    throw new Error(`Invalid download URL format: ${downloadUrl} - ${urlError instanceof Error ? urlError.message : String(urlError)}`);
                                }
                                
                                const fileResponse = await httpClient.sendRequest({
                                    method: HttpMethod.GET,
                                    url: downloadUrl,
                                });

                                if (fileResponse.status === 200 && fileResponse.body) {
                                    let fileData: Buffer;
                                    if (typeof fileResponse.body === 'string') {
                                        fileData = Buffer.from(fileResponse.body, 'binary');
                                    } else {
                                        fileData = Buffer.from(fileResponse.body as ArrayBuffer);
                                    }
                                    storedFileId = await context.files.write({
                                        data: fileData,
                                        fileName: outputFilename,
                                    });
                                }
                            } catch (error) {
                                // Continue without throwing
                            }
                        }

                        return {
                            job: currentJob,
                            download_url: downloadUrl,
                            filename: outputFilename,
                            stored_file_id: storedFileId,
                            input_format,
                            output_format,
                        };
                    } else if (currentJob.status === 'error') {
                        const failedTasks = currentJob.tasks?.filter((task: any) => task.status === 'error') || [];
                        let errorMessage = `Conversion job failed: ${currentJob.message || 'Unknown error'}`;
                        
                        if (failedTasks.length > 0) {
                            const taskErrors = failedTasks.map((task: any) => {
                                let taskError = `${task.name} (${task.operation})`;
                                if (task.code) taskError += ` - Code: ${task.code}`;
                                if (task.message) taskError += ` - ${task.message}`;
                                if (task.engine) taskError += ` - Engine: ${task.engine}`;
                                if (task.engine_version) taskError += ` v${task.engine_version}`;
                                return taskError;
                            }).join('; ');
                            errorMessage += `\n\nTask errors: ${taskErrors}`;
                            
                            const convertTask = failedTasks.find((task: any) => task.operation === 'convert');
                            if (convertTask) {
                                if (convertTask.engine === 'pdftron-pdf2word' && convertTask.code === 'UNKNOWN_ERROR') {
                                    errorMessage += '\n\nThis appears to be a file-specific issue. PDFs from website captures often contain complex layouts or images that cannot be converted to editable formats.';
                                    errorMessage += '\n\nSuggested alternatives:';
                                    errorMessage += '\n• Try converting to TXT (text only) or HTML format instead';
                                    errorMessage += '\n• Use RTF format which is simpler than DOCX';
                                    errorMessage += '\n• If this is a scanned/image-based PDF, it may need OCR processing';
                                    errorMessage += '\n• Consider capturing the website directly to HTML instead of PDF→DOCX';
                                } else if (convertTask.engine === 'pdftron-pdf2word') {
                                    errorMessage += '\n\nTip: Try converting without specifying an engine, or try a different engine for better compatibility.';
                                }
                            }
                        }
                        
                        throw new Error(errorMessage);
                    }

                    await new Promise(resolve => setTimeout(resolve, 5000));
                    attempts++;
                }

                throw new Error('Conversion did not complete within the timeout period');
            }

            return {
                job,
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

});
