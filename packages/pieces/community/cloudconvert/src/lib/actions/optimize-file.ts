import { createAction } from '@activepieces/pieces-framework';
import { propsValidation, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth, CloudConvertClient, optimizeFileSchema } from '../common';
import { Property } from '@activepieces/pieces-framework';

const optimizeFileProps = () => ({
  import_method: Property.StaticDropdown({
    displayName: 'Import Method',
    description: 'How to import the file for optimization',
    required: true,
    options: {
      options: [
        { label: 'File Upload', value: 'upload' },
        { label: 'File URL', value: 'url' },
        { label: 'Stored File ID', value: 'stored_file' },
      ]
    },
    defaultValue: 'upload'
  }),
  file: Property.File({
    displayName: 'File',
    description: 'File to upload and optimize (PDF, PNG, JPG)',
    required: false,
  }),
  url: Property.ShortText({
    displayName: 'File URL',
    description: 'URL of the file to optimize',
    required: false,
  }),
  stored_file_id: Property.ShortText({
    displayName: 'Stored File ID',
    description: 'ID of a previously stored file in Activepieces to optimize',
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
    displayName: 'Output Filename',
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
        { label: '3-Heights', value: '3heights' },
        { label: 'PDF Tools', value: 'pdftools' },
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
  store_file: Property.Checkbox({
    displayName: 'Store File',
    description: 'Download and store the optimized file in Activepieces',
    required: false,
    defaultValue: true,
  }),
});

export const optimizeFile = createAction({
  name: 'optimize_file',
  displayName: 'Optimize File',
  description: 'Creates a task to optimize and compress a file',
  auth: cloudconvertAuth,
  requireAuth: true,
  props: optimizeFileProps(),
  async run(context) {
    await optimizeFileSchema.parseAsync(context.propsValue);
        const { import_method, url, file, stored_file_id, input_format, profile, flatten_signatures, colorspace, filename, engine, engine_version, timeout, wait_for_completion, store_file } = context.propsValue;

        const client = new CloudConvertClient(context.auth);

        try {
            const jobTasks: Record<string, any> = {};

            // Import task
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

            const optimizeOptions: any = {
                input: 'import-file',
            };

            if (input_format) optimizeOptions.input_format = input_format;
            if (profile) optimizeOptions.profile = profile;
            if (flatten_signatures !== undefined) optimizeOptions.flatten_signatures = flatten_signatures;
            if (colorspace) optimizeOptions.colorspace = colorspace;
            if (filename) optimizeOptions.filename = filename;
            if (engine) optimizeOptions.engine = engine;
            if (engine_version) optimizeOptions.engine_version = engine_version;
            if (timeout) optimizeOptions.timeout = timeout;

            jobTasks['optimize-file'] = {
                operation: 'optimize',
                ...optimizeOptions
            };

            jobTasks['export-file'] = {
                operation: 'export/url',
                input: 'optimize-file'
            };

            const job = await client.createJob(jobTasks, `optimize-${Date.now()}`);

            if (wait_for_completion) {
                let attempts = 0;
                const maxAttempts = 60;

                while (attempts < maxAttempts) {
                    const currentJob = await client.getJob(job.id);

                    if (currentJob.status === 'finished') {
                        const exportTaskData = currentJob.tasks?.find((task: any) => task.name === 'export-file');
                        const downloadUrl = exportTaskData?.result?.files?.[0]?.url;
                        const outputFilename = exportTaskData?.result?.files?.[0]?.filename || `optimized-${input_format || 'file'}`;

                        let storedFileId: string | undefined;
                        if (store_file && downloadUrl) {
                            try {
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
                            profile,
                            size: exportTaskData?.result?.files?.[0]?.size || 0,
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


});
