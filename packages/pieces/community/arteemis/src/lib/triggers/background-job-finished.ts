import { ARTEEMIS_EVENTS } from '../common/events';
import { arteemisEventTrigger } from '../common/event-trigger';

export const backgroundJobFinished = arteemisEventTrigger({
  name: 'job_finished',
  event: ARTEEMIS_EVENTS.JOB_FINISHED,
  displayName: 'Background Job Finished',
  description: 'Triggers when a background job ends: an enrichment, a signals run, an import or an enrollment.',
  aiDescription:
    'Fires once per background job that ends (an enrichment, a signals run, an import or an enrollment such as Enroll Contact in Campaign starts), with its type, status (succeeded, failed or cancelled), error and result counts.',
});
