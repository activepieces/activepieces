import {
    createAction,
    Property,
    ActionContext,
} from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertClient } from '../common/client';

const convertFileProps = {
    url: Property.ShortText({
        displayName: 'File URL',
        description: 'URL of the file to convert',
        required: true,
    }),
    input_format: Property.ShortText({
        displayName: 'Input Format',
        description: 'The current format of the file (e.g., pdf, docx). If not set, the extension of the input file is used',
        required: false,
    }),
    output_format: Property.ShortText({
        displayName: 'Output Format',
        description: 'The target format to convert to',
        required: true,
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
        const { url, input_format, output_format, filename, engine, engine_version, timeout, wait_for_completion } = context.propsValue;

        const client = new CloudConvertClient(context.auth);

        try {
            const importTask = await client.createImportTask(url, filename);

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
                'import-file': importTask.id,
                'convert-file': convertTask.id,
                'export-file': exportTask.id,
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
});
