import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { adminProps } from '../../common/admin';
import { gitlabRequest, projectPath } from '../../common/client';
import { gitlabProps, optionalPositiveInt, requirePositiveInt } from '../../common/props';
import { jobLogOutputSchema } from '../../output-schemas-admin';

const ANSI_ESCAPE = /\u001b\[[0-9;?]*[A-Za-z]/g;
const SECTION_MARKER = /section_(?:start|end):\d+:[A-Za-z0-9_.-]+(?:\[[^\]\r\n]*\])?/g;

export function cleanLog(text: string): string {
  return text
    .replace(ANSI_ESCAPE, '')
    .replace(SECTION_MARKER, '')
    .split('\n')
    .map((line) => {
      const body = line.replace(/\r+$/, '');
      return body.slice(body.lastIndexOf('\r') + 1);
    })
    .join('\n');
}

export const getJobLogAction = createAction({
  auth: gitlabAuth,
  name: 'get_job_log',
  displayName: 'Get Job Log',
  description: 'Gets the end of a job console log.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the console log (trace) of a GitLab CI/CD job, keeping only the last Max Characters (default 20000, up to 100000) because errors are usually at the end, with terminal color codes removed; truncated says whether the start was cut. Use to explain why a job failed.',
    idempotent: true,
  },
  props: {
    projectId: gitlabProps.projectId(),
    jobId: adminProps.jobId(),
    maxChars: Property.Number({ displayName: 'Max Characters', description: 'Characters kept from the end of the log. Default 20000, max 100000.', required: false }),
  },
  outputSchema: jobLogOutputSchema,
  async run({ auth, propsValue }) {
    const jobId = requirePositiveInt({ value: propsValue.jobId, label: 'Job ID' });
    const maxChars = optionalPositiveInt({ value: propsValue.maxChars, label: 'Max Characters' }) ?? DEFAULT_LOG_CHARS;
    if (maxChars > MAX_LOG_CHARS) {
      throw new Error(`Max Characters must be at most ${MAX_LOG_CHARS}.`);
    }
    const raw = await gitlabRequest<unknown>({ auth,  method: 'GET', path: `${projectPath(propsValue.projectId)}/jobs/${jobId}/trace` });
    const text = cleanLog(typeof raw === 'string' ? raw : raw === undefined || raw === null ? '' : JSON.stringify(raw));
    const truncated = text.length > maxChars;
    return { jobId, log: truncated ? text.slice(text.length - maxChars) : text, truncated, totalLength: text.length };
  },
});

export const DEFAULT_LOG_CHARS = 20_000;

export const MAX_LOG_CHARS = 100_000;
