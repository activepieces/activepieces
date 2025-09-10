import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ApFile, PieceAuthProperty, TriggerHookContext, TriggerStrategy } from '@activepieces/pieces-framework';
import { CloudConvertJob, CloudConvertTask } from './types';
import crypto from 'crypto';

async function waitForJobToFinish(
  jobId: string,
  auth: string
): Promise<CloudConvertJob> {
  let updatedJob: CloudConvertJob;

  do {
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const getJobResponse = await httpClient.sendRequest<{
      data: CloudConvertJob;
    }>({
      method: HttpMethod.GET,
      url: `https://api.cloudconvert.com/v2/jobs/${jobId}`,
      headers: { Authorization: `Bearer ${auth}` },
    });
    updatedJob = getJobResponse.body.data;
  } while (updatedJob.status !== 'finished' && updatedJob.status !== 'error');

  return updatedJob;
}

async function archive(
  auth: string,
  props: { files: ApFile[]; output_format: string; output_filename?: string }
): Promise<Record<string, unknown>> {
  const { files, output_format, output_filename } = props;

  const importTasks: Record<string, { operation: string }> = {};
  const importTaskNames: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const taskName = `import-${i + 1}`;
    importTaskNames.push(taskName);
    importTasks[taskName] = { operation: 'import/upload' };
  }
  const jobDefinition = {
    tasks: {
      ...importTasks,
      'archive-task': {
        operation: 'archive',
        input: importTaskNames,
        output_format: output_format,
        filename: output_filename || undefined,
      },
      'export-file': { operation: 'export/url', input: 'archive-task' },
    },
  };

  const createJobResponse = await httpClient.sendRequest<{
    data: CloudConvertJob;
  }>({
    method: HttpMethod.POST,
    url: 'https://api.cloudconvert.com/v2/jobs',
    headers: { Authorization: `Bearer ${auth}` },
    body: jobDefinition,
  });
  const job = createJobResponse.body.data;

  const uploadTasks = job.tasks.filter(
    (task) => task.operation === 'import/upload'
  );
  const uploadPromises = uploadTasks.map((task, index) => {
    const uploadUrl = task.result?.form?.url;
    if (!uploadUrl)
      throw new Error(
        `Could not get an upload URL for one of the files. Task name: ${task.name}`
      );
    return httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: uploadUrl,
      body: files[index].data,
      headers: { 'Content-Type': 'application/octet-stream' },
    });
  });
  await Promise.all(uploadPromises);

  const finishedJob = await waitForJobToFinish(job.id, auth);

  if (finishedJob.status === 'error') {
    const failedTask = finishedJob.tasks.find(
      (task: CloudConvertTask) => task.status === 'error'
    );
    throw new Error(
      `Archiving files failed: ${failedTask?.message || 'Unknown error'}`
    );
  }

  const exportTask = finishedJob.tasks.find(
    (task: CloudConvertTask) => task.operation === 'export/url'
  );
  return exportTask?.result?.files?.[0] as Record<string, unknown>;
}

async function capture(auth: string, props: { url: string, output_format: string }): Promise<Record<string, unknown>> {
    const { url, output_format } = props;

    const jobDefinition = {
        tasks: {
            'capture-task': {
                'operation': 'capture-website',
                'url': url,
                'output_format': output_format,
            },
            'export-file': {
                'operation': 'export/url',
                'input': 'capture-task',
            }
        }
    };

    const createJobResponse = await httpClient.sendRequest<{ data: CloudConvertJob }>({
        method: HttpMethod.POST,
        url: 'https://api.cloudconvert.com/v2/jobs',
        headers: { 'Authorization': `Bearer ${auth}` },
        body: jobDefinition
    });
    const job = createJobResponse.body.data;

    const finishedJob = await waitForJobToFinish(job.id, auth);

    if (finishedJob.status === 'error') {
        const failedTask = finishedJob.tasks.find((task: CloudConvertTask) => task.status === 'error');
        throw new Error(`Website capture failed: ${failedTask?.message || 'Unknown error'}`);
    }

    const exportTask = finishedJob.tasks.find((task: CloudConvertTask) => task.operation === 'export/url');
    return exportTask?.result?.files?.[0] as Record<string, unknown>;
}

async function convert(auth: string, props: { file: ApFile, output_format: string }): Promise<Record<string, unknown>> {
    const { file, output_format } = props;

    const jobDefinition = {
        tasks: {
            'import-file': { 'operation': 'import/upload' },
            'convert-file': {
                'operation': 'convert', 'input': 'import-file', 'output_format': output_format,
            },
            'export-file': { 'operation': 'export/url', 'input': 'convert-file' }
        }
    };

    const createJobResponse = await httpClient.sendRequest<{ data: CloudConvertJob }>({
        method: HttpMethod.POST, url: 'https://api.cloudconvert.com/v2/jobs',
        headers: { 'Authorization': `Bearer ${auth}` }, body: jobDefinition
    });
    const job = createJobResponse.body.data;

    const uploadTask = job.tasks.find((task) => task.operation === 'import/upload');
    const uploadUrl = uploadTask?.result?.form?.url;
    if (!uploadUrl) throw new Error("Could not retrieve file upload URL from CloudConvert.");
    await httpClient.sendRequest({
        method: HttpMethod.PUT, url: uploadUrl, body: file.data,
        headers: { 'Content-Type': 'application/octet-stream' },
    });

    const finishedJob = await waitForJobToFinish(job.id, auth);

    if (finishedJob.status === 'error') {
        const failedTask = finishedJob.tasks.find((task: CloudConvertTask) => task.status === 'error');
        throw new Error(`File conversion failed: ${failedTask?.message || 'Unknown error'}`);
    }

    const exportTask = finishedJob.tasks.find((task: CloudConvertTask) => task.operation === 'export/url');
    return exportTask?.result?.files?.[0] as Record<string, unknown>;
}

async function download(auth: string, taskId: string): Promise<{ filename: string, data: Buffer }> {
    const getTaskResponse = await httpClient.sendRequest<{ data: CloudConvertTask }>({
        method: HttpMethod.GET,
        url: `https://api.cloudconvert.com/v2/tasks/${taskId}`,
        headers: { 'Authorization': `Bearer ${auth}` },
    });
    const task = getTaskResponse.body.data;

    if (task.status !== 'finished') {
        throw new Error(`Task with ID ${taskId} is not finished. Current status: ${task.status}`);
    }
    const outputFile = task.result?.files?.[0];
    if (!outputFile?.url || !outputFile?.filename) {
        throw new Error(`Task with ID ${taskId} did not produce an output file or the URL is missing.`);
    }

    const fileBufferResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: outputFile.url,
        responseType: 'arraybuffer'
    });

    return {
        filename: outputFile.filename,
        data: Buffer.from(fileBufferResponse.body as ArrayBuffer),
    };
}

async function merge(auth: string, props: { files: ApFile[], output_filename?: string }): Promise<Record<string, unknown>> {
    const { files, output_filename } = props;

    const importTasks: Record<string, { operation: string }> = {};
    const importTaskNames: string[] = [];
    for (let i = 0; i < files.length; i++) {
        const taskName = `import-${i + 1}`;
        importTaskNames.push(taskName);
        importTasks[taskName] = { 'operation': 'import/upload' };
    }
    const jobDefinition = {
        tasks: {
            ...importTasks,
            'merge-task': {
                'operation': 'merge', 'input': importTaskNames, 'output_format': 'pdf', 'filename': output_filename || undefined,
            },
            'export-file': { 'operation': 'export/url', 'input': 'merge-task' }
        }
    };

    const createJobResponse = await httpClient.sendRequest<{ data: CloudConvertJob }>({
        method: HttpMethod.POST, url: 'https://api.cloudconvert.com/v2/jobs',
        headers: { 'Authorization': `Bearer ${auth}` }, body: jobDefinition
    });
    const job = createJobResponse.body.data;

    const uploadTasks = job.tasks.filter((task) => task.operation === 'import/upload');
    const uploadPromises = uploadTasks.map((task, index) => {
        const uploadUrl = task.result?.form?.url;
        if (!uploadUrl) throw new Error(`Could not get an upload URL for one of the files. Task name: ${task.name}`);
        return httpClient.sendRequest({
            method: HttpMethod.PUT, url: uploadUrl, body: files[index].data,
            headers: { 'Content-Type': 'application/octet-stream' },
        });
    });
    await Promise.all(uploadPromises);

    const finishedJob = await waitForJobToFinish(job.id, auth);

    if (finishedJob.status === 'error') {
        const failedTask = finishedJob.tasks.find((task: CloudConvertTask) => task.status === 'error');
        throw new Error(`Merging files failed: ${failedTask?.message || 'Unknown error'}`);
    }

    const exportTask = finishedJob.tasks.find((task: CloudConvertTask) => task.operation === 'export/url');
    return exportTask?.result?.files?.[0] as Record<string, unknown>;
}

async function optimize(auth: string, props: { file: ApFile, profile?: string, engine?: string }): Promise<Record<string, unknown>> {
    const { file, profile, engine } = props;

    const jobDefinition = {
        tasks: {
            'import-file': { 'operation': 'import/upload' },
            'optimize-task': {
                'operation': 'optimize', 'input': 'import-file', 'profile': profile || undefined, 'engine': engine || undefined,
            },
            'export-file': { 'operation': 'export/url', 'input': 'optimize-task' }
        }
    };

    const createJobResponse = await httpClient.sendRequest<{ data: CloudConvertJob }>({
        method: HttpMethod.POST, url: 'https://api.cloudconvert.com/v2/jobs',
        headers: { 'Authorization': `Bearer ${auth}` }, body: jobDefinition
    });
    const job = createJobResponse.body.data;

    const uploadTask = job.tasks.find((task) => task.operation === 'import/upload');
    const uploadUrl = uploadTask?.result?.form?.url;
    if (!uploadUrl) throw new Error("Could not retrieve file upload URL from CloudConvert.");
    await httpClient.sendRequest({
        method: HttpMethod.PUT, url: uploadUrl, body: file.data,
        headers: { 'Content-Type': 'application/octet-stream' },
    });

    const finishedJob = await waitForJobToFinish(job.id, auth);

    if (finishedJob.status === 'error') {
        const failedTask = finishedJob.tasks.find((task: CloudConvertTask) => task.status === 'error');
        throw new Error(`File optimization failed: ${failedTask?.message || 'Unknown error'}`);
    }

    const exportTask = finishedJob.tasks.find((task: CloudConvertTask) => task.operation === 'export/url');
    return exportTask?.result?.files?.[0] as Record<string, unknown>;
}

async function createWebhook(auth: string, webhookUrl: string, events: string[]) {
    return await httpClient.sendRequest<{ data: { id: string, signing_secret: string } }>({
        method: HttpMethod.POST,
        url: 'https://api.cloudconvert.com/v2/webhooks',
        headers: { 'Authorization': `Bearer ${auth}` },
        body: {
            'url': webhookUrl,
            'events': events,
        },
    });
}

async function deleteWebhook(auth: string, webhookId: string) {
    return await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.cloudconvert.com/v2/webhooks/${webhookId}`,
        headers: { 'Authorization': `Bearer ${auth}` },
    });
}

async function validateSignature(
    context: TriggerHookContext<PieceAuthProperty, Record<string, never>, TriggerStrategy.WEBHOOK>,
    triggerName: string 
): Promise<boolean> {
    
    const signingSecret = await context.store.get<string>(`cc_signing_secret_${triggerName}`);
    const signature = context.payload.headers['cloudconvert-signature'] as string;
    const rawBody = typeof context.payload.rawBody === 'string'
        ? context.payload.rawBody
        : JSON.stringify(context.payload.body ?? {});

    if (!signingSecret || !signature) return false;

    const computedSignature = crypto.createHmac('sha256', signingSecret).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
}

export const cloudConvertApiService = {
  archive,
  createWebhook,
  deleteWebhook,
  validateSignature,
  capture,
  convert,
  download,
  merge,
  optimize,
};
