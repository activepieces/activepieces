import { createAction, Property } from '@activepieces/pieces-framework';
import { mindeeAuth } from '../auth';
import { mindeeInference } from '../common/inference';
import { mindeeProps } from '../common/props';
import { mindeeSchemas } from '../output-schemas';

export const getJobStatusAction = createAction({
  auth: mindeeAuth,
  name: 'get_job_status',
  displayName: 'Get Job Status',
  description: 'Checks whether a Mindee job has finished and returns its inference ID.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Check a Mindee processing job by job_id (returned when an extract/classify/crop/OCR/split run hit its wait limit). When status is Processed it returns product and inference_id for Get Result. Read-only, free, safe to retry.',
    idempotent: true,
  },
  props: {
    job_id: Property.ShortText({ displayName: 'Job ID', required: true }),
  },
  outputSchema: mindeeSchemas.jobStatus,
  async run({ auth, propsValue }) {
    const job = await mindeeInference.getJob({ apiKey: auth.secret_text, jobId: propsValue.job_id });
    return mindeeInference.jobSummary(job);
  },
});

export const getResultAction = createAction({
  auth: mindeeAuth,
  name: 'get_result',
  displayName: 'Get Result',
  description: 'Gets the result of a finished Mindee inference.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Get the result of a finished Mindee inference by product (extraction, classification, crop, ocr, split) and inference_id (from Get Job Status). Returns the same shape as the run actions. Only for runs that returned completed=false: once a result has been fetched, Mindee may delete the job and inference (depending on the account data retention setting) and this returns not found. Read-only, free.',
    idempotent: true,
  },
  props: {
    product: mindeeProps.productProp(),
    inference_id: Property.ShortText({ displayName: 'Inference ID', required: true }),
  },
  outputSchema: mindeeSchemas.anyResult,
  async run({ auth, propsValue }) {
    return mindeeInference.getResult({ apiKey: auth.secret_text, product: propsValue.product, inferenceId: propsValue.inference_id });
  },
});
