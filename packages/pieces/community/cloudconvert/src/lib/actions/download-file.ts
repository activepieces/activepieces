import {
    createAction,
    Property,
    ActionContext,
} from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { CloudConvertClient } from '../common/client';

const downloadFileProps = {
    job_id: Property.ShortText({
        displayName: 'Job ID',
        description: 'ID of the completed CloudConvert job',
        required: true,
    }),
    task_id: Property.ShortText({
        displayName: 'Task ID',
        description: 'ID of the export task (optional, will find automatically if not provided)',
        required: false,
    }),
    file_index: Property.Number({
        displayName: 'File Index',
        description: 'Index of the file to download (0-based, default: 0)',
        required: false,
        defaultValue: 0,
    }),
} as const;

type DownloadFileContext = ActionContext<typeof cloudconvertAuth, typeof downloadFileProps>;

export const downloadFile = createAction({
    name: 'download_file',
    displayName: 'Download File',
    description: 'Get download URL for output files from completed CloudConvert jobs',
    auth: cloudconvertAuth,
    requireAuth: true,
    props: downloadFileProps,
    async run(context: DownloadFileContext) {
        const { job_id, task_id, file_index } = context.propsValue;

        const client = new CloudConvertClient(context.auth);

        try {
            const job = await client.getJob(job_id);

            if (job.status !== 'finished') {
                throw new Error(`Job is not finished. Current status: ${job.status}`);
            }

            let exportTaskId = task_id;
            let exportTask = null;

            if (!exportTaskId) {
                for (const task of job.tasks) {
                    if (task.operation === 'export/url' && task.status === 'finished') {
                        exportTaskId = task.id;
                        exportTask = task;
                        break;
                    }
                }
            }

            if (!exportTaskId) {
                throw new Error('No completed export task found in the job');
            }

            if (!exportTask) {
                exportTask = await client.getTask(exportTaskId);
            }

            if (!exportTask.result || !exportTask.result.files || exportTask.result.files.length === 0) {
                throw new Error('No files found in the export task');
            }

            const fileIndex = file_index || 0;
            if (fileIndex >= exportTask.result.files.length) {
                throw new Error(`File index ${fileIndex} is out of range. Available files: ${exportTask.result.files.length}`);
            }

            const file = exportTask.result.files[fileIndex];

            return {
                job_id,
                task_id: exportTaskId,
                filename: file.filename,
                size: file.size,
                download_url: file.url,
                file_index: fileIndex,
                total_files: exportTask.result.files.length,
            };
        } catch (error) {
            if (error instanceof Error) {
                throw error;
            }
            throw new Error(`Download failed: ${String(error)}`);
        }
    },
});
