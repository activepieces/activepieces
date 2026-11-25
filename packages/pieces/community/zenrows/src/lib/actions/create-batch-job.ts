import { createAction, Property } from '@activepieces/pieces-framework';
import { zenrowsAuth } from '../auth';
import { zenrowsClient } from '../common/client';

export const createBatchJobAction = createAction({
  auth: zenrowsAuth,
  name: "create_batch_job",
  classification: "WRITE",
  displayName: "Create Batch Job",
  description: "Scrape many URLs in one job, now or on a schedule. Read the results later with Get Batch Job and Get Batch Results.",
  audience: 'both',
  aiMetadata: {
    description: "Creates a batch job that scrapes a list of URLs (up to 100,000) in the background and returns its job_id at once. Pick it over Scrape URL for more than a handful of pages. Poll Get Batch Job until latest_run.status is terminal, then page through Get Batch Results. Each call creates a new job and spends credits per page, so a retry duplicates the work.",
    idempotent: false,
  },
  props: {
    type: Property.StaticDropdown({ displayName: "Type", description: "Regular runs once, now. Scheduled runs on the schedule you give in Schedule.", required: false, defaultValue: "regular", options: { disabled: false, options: [{ label: "Regular", value: "regular" }, { label: "Scheduled", value: "scheduled" }] } }),
    status: Property.StaticDropdown({ displayName: "Status", description: "Closed (the default) means Tasks is the full list of URLs. Open is only for regular jobs.", required: false, defaultValue: "closed", options: { disabled: false, options: [{ label: "Open", value: "open" }, { label: "Closed", value: "closed" }] } }),
    zenrows_params: Property.Json({ displayName: "Zenrows Params", description: "Scrape options for every task, as JSON, for example {\"mode\": \"auto\"} or {\"js_render\": \"true\", \"response_type\": \"markdown\"}. Supported keys: mode, js_render, js_instructions, custom_headers, premium_proxy, proxy_country, session_id, original_status, allowed_status_codes, wait_for, wait, block_resources, json_response, css_extractor, autoparse, extract, extract_fields, response_type, outputs. Screenshots are not supported. A task's own zenrows_params win over these.", required: false }),
    schedule: Property.Json({ displayName: "Schedule", description: "For a scheduled job only, as JSON with exactly one of at, rate or calendar, for example {\"rate\": \"1 day\"}.", required: false }),
    tasks: Property.Json({ displayName: "Tasks", description: "The URLs to scrape, as a JSON list, for example [{\"url\": \"https://example.com/\"}]. Each task can also have external_id, metadata and its own zenrows_params.", required: false }),
    file_input_id: Property.ShortText({ displayName: "File Input ID", description: "The ID of a CSV of URLs uploaded through the Zenrows API, instead of Tasks.", required: false }),
    external_id: Property.ShortText({ displayName: "External ID", description: "Your own ID for the job, returned with it. It doesn't need to be unique.", required: false }),
    name: Property.ShortText({ displayName: "Name", description: "A label for the job, up to 100 characters.", required: false }),
    metadata: Property.Json({ displayName: "Metadata", description: "Your own key/value pairs, as JSON, kept with the job.", required: false }),
    webhook: Property.Json({ displayName: "Webhook", description: "Where to send a notification when the run ends, as JSON, for example {\"url\": \"https://example.com/hook\"}.", required: false }),
  },
  async run({ auth, propsValue, files }) {
    return zenrowsClient.callOperation({ apiKey: auth.secret_text, operation: {"method":"POST","server":"https://async.api.zenrows.com/v1","path":"/jobs","key":"header","body":["type","status","zenrows_params","schedule","tasks","file_input_id","external_id","name","metadata","webhook"]}, values: propsValue, files });
  },
});
