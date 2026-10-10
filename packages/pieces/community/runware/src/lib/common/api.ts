import { runwareClient } from './client';

import type { RunwareAuthValue, RunwareTask, RunwareTaskResponse } from './types';

async function runTask({
	auth,
	task,
}: {
	auth: RunwareAuthValue;
	task: RunwareTask;
}): Promise<RunwareTaskResponse> {
	return await runwareClient.request<RunwareTaskResponse>({ auth, task });
}

export const runwareApi = { runTask };
