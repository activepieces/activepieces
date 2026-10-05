import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const checkJobStatus = createAction({
	auth: pdfCoAuth,
	name: 'check_job_status',
	displayName: 'Check Job Status',
	description: 'Check a PDF.co background job and get its result link when it is done.',
	audience: 'both',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns the status (working, success, failed or aborted) and result link of a background PDF.co job started with "Run in Background", optionally saving the finished result as a file. Use when an earlier PDF.co step returned status "working" and a job ID. Each check costs 2 credits; read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: pdfCoOutputSchemas.jobStatus,
	props: {
		jobId: Property.ShortText({
			displayName: 'Job ID',
			description: 'The Job ID returned by an earlier PDF.co step that ran in the background.',
			required: true,
		}),
		saveOutputFile: pdfCoProps.saveOutputFile({ defaultValue: false }),
	},
	async run({ auth, propsValue, files }) {
		const jobId = propsValue.jobId.trim();
		if (jobId === '') {
			throw new Error('Job ID is required.');
		}
		const check = await pdfCoJobs.checkJob({ apiKey: pdfCoClient.apiKeyOf(auth), jobId });
		const status = typeof check['status'] === 'string' ? check['status'] : 'unknown';
		const url = pdfCoFiles.nonEmptyString(check['url']);
		const parts = pdfCoJobs.stringList(check['body']);
		const urls = parts === undefined || parts.length === 0 ? undefined : parts;
		const output = {
			job_id: jobId,
			status,
			message: pdfCoFiles.nonEmptyString(check['message']),
			url,
			urls,
			page_count: typeof check['pageCount'] === 'number' ? check['pageCount'] : undefined,
			link_valid_until: pdfCoFiles.nonEmptyString(check['outputLinkValidTill']),
			credits_used: typeof check['credits'] === 'number' ? check['credits'] : undefined,
			remaining_credits: typeof check['remainingCredits'] === 'number' ? check['remainingCredits'] : undefined,
		};
		if (propsValue.saveOutputFile !== true || status !== 'success' || url === undefined) {
			return output;
		}
		try {
			if (urls === undefined) {
				return { ...output, file: await pdfCoFiles.saveToFlow({ files, url }) };
			}
			const saved = await Promise.all(urls.map((part) => pdfCoFiles.saveToFlow({ files, url: part })));
			return { ...output, file: saved[0], files: saved };
		} catch (error) {
			const reason = error instanceof Error ? error.message : String(error);
			return { ...output, file_error: `The result could not be saved as a file: ${reason}. Use the link instead.` };
		}
	},
});
