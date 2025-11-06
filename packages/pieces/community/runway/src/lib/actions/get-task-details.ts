import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { runwayAuth } from '../common';
import RunwayML from '@runwayml/sdk';
import { z } from 'zod';

// Helper function to get file extension from URL or Content-Type
const getFileExtensionFromUrl = (url: string, contentType?: string): string => {
	// Try to get extension from URL first
	const urlExt = url.split('.').pop()?.split('?')[0]?.toLowerCase();
	if (urlExt && ['mp4', 'mov', 'avi', 'gif', 'webm', 'jpg', 'jpeg', 'png', 'webp'].includes(urlExt)) {
		return urlExt;
	}
	
	// Fallback to content type
	if (contentType) {
		if (contentType.includes('video/mp4')) return 'mp4';
		if (contentType.includes('video/quicktime')) return 'mov';
		if (contentType.includes('video/webm')) return 'webm';
		if (contentType.includes('image/gif')) return 'gif';
		if (contentType.includes('image/jpeg')) return 'jpg';
		if (contentType.includes('image/png')) return 'png';
		if (contentType.includes('image/webp')) return 'webp';
	}
	
	// Default fallback
	return 'mp4';
};

const getStatusDescription = (status: string): string => {
	switch (status) {
		case 'PENDING': return 'Task is queued and waiting to start';
		case 'THROTTLED': return 'Task is waiting for other jobs to complete';
		case 'RUNNING': return 'Task is currently being processed';
		case 'SUCCEEDED': return 'Task completed successfully';
		case 'FAILED': return 'Task failed to complete';
		case 'CANCELLED': return 'Task was cancelled or aborted';
		default: return 'Unknown status';
	}
};

export const getTaskDetails = createAction({
	auth: runwayAuth,
	name: 'get_task_details',
	displayName: 'Get Task Details',
	description: 'Retrieve details of an existing Runway task by its ID',
	props: {
		taskId: Property.ShortText({ 
			displayName: 'Task ID', 
			description: 'The unique ID of the task to retrieve (UUID format)',
			required: true 
		}),
		downloadOutput: Property.Checkbox({ 
			displayName: 'Download Output Files', 
			description: 'Download and return the generated files as attachments (if task succeeded)',
			required: false,
			defaultValue: false
		}),
	},
	async run({ auth, propsValue, files }) {
		// Zod validation
		await propsValidation.validateZod(propsValue, {
			taskId: z.string().uuid('Task ID must be a valid UUID format'),
		});

		const apiKey = auth as string;
		const client = new RunwayML({ apiKey });

		let task;
		try {
			task = await client.tasks.retrieve(propsValue.taskId);
		} catch (error: any) {
			if (error.status === 404) {
				throw new Error(`Task not found: ${propsValue.taskId}. Please verify the task ID is correct.`);
			}
			throw new Error(`Failed to retrieve task: ${error.message || 'Unknown error'}`);
		}

		const outputs = task.output || [];
		const artifacts: Array<any> = [];
		
		// Download output files if requested and available
		if (propsValue.downloadOutput && outputs.length > 0) {
			if (task.status !== 'SUCCEEDED') {
				console.warn(`Task status is ${task.status}, but download was requested. Only succeeded tasks have downloadable outputs.`);
			} else {
				for (const [index, url] of outputs.entries()) {
					try {
						// First, make a HEAD request to get content type
						const headResponse = await httpClient.sendRequest({
							method: HttpMethod.HEAD,
							url,
							authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
							timeout: 30000,
						});
						
						const contentType = headResponse.headers?.['content-type'] as string;
						const extension = getFileExtensionFromUrl(url, contentType);
						
						// Now download the actual file
						const response = await httpClient.sendRequest<ArrayBuffer>({
							method: HttpMethod.GET,
							url,
							responseType: 'arraybuffer',
							authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
							timeout: 300000, // 5 minutes for large video files
						});

						const file = await files.write({
							fileName: `runway-output-${task.id}-${index + 1}.${extension}`,
							data: Buffer.from(response.body as any),
						});
						
						artifacts.push({
							fileName: `runway-output-${task.id}-${index + 1}.${extension}`,
							fileUrl: file,
							contentType: contentType,
							originalUrl: url,
							index: index + 1
						});
					} catch (downloadError: any) {
						console.error(`Failed to download output ${index + 1}:`, downloadError.message);
						// Continue with other files even if one fails
					}
				}
			}
		}

		// Calculate completion percentage for display
		let completionPercentage = 0;
		if (task.status === 'SUCCEEDED') {
			completionPercentage = 100;
		} else if (task.status === 'RUNNING' && typeof task.progress === 'number') {
			completionPercentage = Math.round(task.progress * 100);
		}

		return {
			success: true,
			taskId: task.id,
			status: task.status,
			statusDescription: getStatusDescription(task.status),
			createdAt: task.createdAt,
			completionPercentage,
			progress: task.progress,
			outputUrls: outputs,
			downloadedFiles: artifacts,
			hasOutputs: outputs.length > 0,
			isComplete: task.status === 'SUCCEEDED',
			isFailed: task.status === 'FAILED',
			isRunning: task.status === 'RUNNING',
			failureCode: task.failureCode,
			failureMessage: task.failure,
			// Summary for easy consumption
			summary: {
				id: task.id,
				status: task.status,
				created: task.createdAt,
				progress: completionPercentage,
				outputCount: outputs.length,
				downloadedCount: artifacts.length
			}
		};
	},
});


