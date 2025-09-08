import {
    createAction,
    Property,
    ActionContext,
} from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertClient } from '../common/client';

const optimizeFileProps = {
    url: Property.ShortText({
        displayName: 'File URL',
        description: 'URL of the file to optimize',
        required: true,
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
    }),
    engine: Property.ShortText({
        displayName: 'Engine',
        description: 'Use a specific engine for the conversion',
        required: false,
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
        const { url, input_format, profile, flatten_signatures, colorspace, filename, engine, engine_version, timeout, wait_for_completion } = context.propsValue;

        const client = new CloudConvertClient(context.auth);

        try {
            const importTask = await client.createImportTask(url, filename);

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
                'import-file': importTask.id,
                'optimize-file': optimizeTask.id,
                'export-file': exportTask.id,
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
});
