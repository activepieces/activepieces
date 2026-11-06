import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function f({ key, label, format }: { key: string; label: string; format?: OutputSchemaField['format'] }): OutputSchemaField {
  return format === undefined ? { key, label } : { key, label, format };
}

const jobRefFields: OutputSchemaField[] = [f({ key: 'shortcode', label: 'Job Shortcode' }), f({ key: 'title', label: 'Job Title' })];

const candidateSummaryFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'Candidate ID' }),
  f({ key: 'name', label: 'Name' }),
  f({ key: 'firstname', label: 'First Name' }),
  f({ key: 'lastname', label: 'Last Name' }),
  f({ key: 'headline', label: 'Headline' }),
  f({ key: 'email', label: 'Email', format: 'email' }),
  f({ key: 'phone', label: 'Phone' }),
  f({ key: 'stage', label: 'Stage' }),
  f({ key: 'stage_kind', label: 'Stage Kind' }),
  f({ key: 'disqualified', label: 'Disqualified', format: 'boolean' }),
  f({ key: 'disqualification_reason', label: 'Disqualification Reason' }),
  f({ key: 'sourced', label: 'Sourced', format: 'boolean' }),
  f({ key: 'domain', label: 'Source Domain' }),
  f({ key: 'profile_url', label: 'Profile URL', format: 'url' }),
  { key: 'job', label: 'Job', children: jobRefFields },
  f({ key: 'created_at', label: 'Created At', format: 'datetime' }),
  f({ key: 'updated_at', label: 'Updated At', format: 'datetime' }),
];

const candidateFields: OutputSchemaField[] = [
  ...candidateSummaryFields,
  f({ key: 'address', label: 'Address' }),
  f({ key: 'summary', label: 'Summary' }),
  f({ key: 'cover_letter', label: 'Cover Letter' }),
  f({ key: 'resume_url', label: 'Resume URL', format: 'url' }),
  f({ key: 'image_url', label: 'Image URL', format: 'image' }),
  f({ key: 'outbound_mailbox', label: 'Outbound Mailbox', format: 'email' }),
  { key: 'tags', label: 'Tags' },
  { key: 'skills', label: 'Skills', labelKey: 'name', listItems: [f({ key: 'name', label: 'Skill' })] },
  {
    key: 'social_profiles',
    label: 'Social Profiles',
    labelKey: 'type',
    listItems: [f({ key: 'type', label: 'Type' }), f({ key: 'url', label: 'URL', format: 'url' })],
  },
  {
    key: 'experience_entries',
    label: 'Experience',
    labelKey: 'company',
    listItems: [
      f({ key: 'title', label: 'Title' }),
      f({ key: 'company', label: 'Company' }),
      f({ key: 'start_date', label: 'Start Date', format: 'date' }),
      f({ key: 'end_date', label: 'End Date', format: 'date' }),
      f({ key: 'current', label: 'Current', format: 'boolean' }),
    ],
  },
  {
    key: 'education_entries',
    label: 'Education',
    labelKey: 'school',
    listItems: [
      f({ key: 'school', label: 'School' }),
      f({ key: 'degree', label: 'Degree' }),
      f({ key: 'field_of_study', label: 'Field of Study' }),
      f({ key: 'start_date', label: 'Start Date', format: 'date' }),
      f({ key: 'end_date', label: 'End Date', format: 'date' }),
    ],
  },
];

const jobFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'Job ID' }),
  f({ key: 'shortcode', label: 'Shortcode' }),
  f({ key: 'title', label: 'Title' }),
  f({ key: 'full_title', label: 'Full Title' }),
  f({ key: 'code', label: 'Job Code' }),
  f({ key: 'state', label: 'State' }),
  f({ key: 'department', label: 'Department' }),
  f({ key: 'url', label: 'Job URL', format: 'url' }),
  f({ key: 'application_url', label: 'Application URL', format: 'url' }),
  f({ key: 'shortlink', label: 'Short Link', format: 'url' }),
  {
    key: 'location',
    label: 'Location',
    children: [
      f({ key: 'location_str', label: 'Location' }),
      f({ key: 'country', label: 'Country' }),
      f({ key: 'country_code', label: 'Country Code' }),
      f({ key: 'region', label: 'Region' }),
      f({ key: 'city', label: 'City' }),
      f({ key: 'zip_code', label: 'ZIP Code' }),
      f({ key: 'telecommuting', label: 'Remote', format: 'boolean' }),
    ],
  },
  f({ key: 'created_at', label: 'Created At', format: 'datetime' }),
];

const jobDetailFields: OutputSchemaField[] = [
  ...jobFields,
  f({ key: 'description', label: 'Description', format: 'html' }),
  f({ key: 'requirements', label: 'Requirements', format: 'html' }),
  f({ key: 'benefits', label: 'Benefits', format: 'html' }),
  f({ key: 'employment_type', label: 'Employment Type' }),
  f({ key: 'industry', label: 'Industry' }),
  f({ key: 'function', label: 'Function' }),
  f({ key: 'experience', label: 'Experience' }),
  f({ key: 'education', label: 'Education' }),
  f({ key: 'keywords', label: 'Keywords' }),
];

const memberFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'Member ID' }),
  f({ key: 'name', label: 'Name' }),
  f({ key: 'headline', label: 'Headline' }),
  f({ key: 'email', label: 'Email', format: 'email' }),
  f({ key: 'role', label: 'Role' }),
  f({ key: 'active', label: 'Active', format: 'boolean' }),
];

const stageFields: OutputSchemaField[] = [
  f({ key: 'slug', label: 'Stage Slug' }),
  f({ key: 'name', label: 'Name' }),
  f({ key: 'kind', label: 'Kind' }),
  f({ key: 'position', label: 'Position', format: 'number' }),
];

function page({ key, label, labelKey, itemFields }: { key: string; label: string; labelKey: string; itemFields: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [
      { key, label, labelKey, listItems: itemFields },
      f({ key: 'count', label: 'Items Returned', format: 'number' }),
      {
        key: 'nextCursor',
        label: 'Next Cursor',
        description: 'Pass this as Cursor to get the next page. Empty when there are no more results.',
      },
      f({ key: 'hasMore', label: 'Has More', format: 'boolean' }),
    ],
  };
}

function plainList({ key, label, labelKey, itemFields }: { key: string; label: string; labelKey: string; itemFields: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [{ key, label, labelKey, listItems: itemFields }, f({ key: 'count', label: 'Items Returned', format: 'number' })],
  };
}

export const workableSchemas = {
  candidate: { fields: candidateFields } satisfies OutputSchema,
  candidateWebhook: {
    fields: [
      ...candidateFields,
      f({ key: 'event_type', label: 'Event Type' }),
      f({ key: 'fired_at', label: 'Fired At', format: 'datetime' }),
    ],
  } satisfies OutputSchema,
  createdCandidate: {
    fields: [...candidateFields, f({ key: 'talent_pool', label: 'Added to Talent Pool', format: 'boolean' })],
  } satisfies OutputSchema,
  job: { fields: jobDetailFields } satisfies OutputSchema,
  candidates: page({ key: 'candidates', label: 'Candidates', labelKey: 'name', itemFields: candidateSummaryFields }),
  jobs: page({ key: 'jobs', label: 'Jobs', labelKey: 'title', itemFields: jobFields }),
  members: page({ key: 'members', label: 'Members', labelKey: 'name', itemFields: memberFields }),
  stages: plainList({ key: 'stages', label: 'Stages', labelKey: 'name', itemFields: stageFields }),
  recruiters: plainList({
    key: 'recruiters',
    label: 'Recruiters',
    labelKey: 'name',
    itemFields: [f({ key: 'id', label: 'Recruiter ID' }), f({ key: 'name', label: 'Name' }), f({ key: 'email', label: 'Email', format: 'email' })],
  }),
  disqualificationReasons: plainList({
    key: 'reasons',
    label: 'Disqualification Reasons',
    labelKey: 'description',
    itemFields: [
      f({ key: 'id', label: 'Reason ID' }),
      f({ key: 'description', label: 'Reason' }),
      f({ key: 'candidate_withdrew', label: 'Candidate Withdrew', format: 'boolean' }),
      f({ key: 'position', label: 'Position', format: 'number' }),
    ],
  }),
  questions: plainList({
    key: 'questions',
    label: 'Questions',
    labelKey: 'body',
    itemFields: [
      f({ key: 'key', label: 'Question Key' }),
      f({ key: 'body', label: 'Question' }),
      f({ key: 'type', label: 'Type' }),
      f({ key: 'required', label: 'Required', format: 'boolean' }),
      { key: 'choices', label: 'Choices', labelKey: 'body', listItems: [f({ key: 'id', label: 'Choice ID' }), f({ key: 'body', label: 'Choice' })] },
    ],
  }),
  activities: plainList({
    key: 'activities',
    label: 'Activities',
    labelKey: 'action',
    itemFields: [
      f({ key: 'id', label: 'Activity ID' }),
      f({ key: 'action', label: 'Action' }),
      f({ key: 'stage_name', label: 'Stage' }),
      { key: 'target_stage', label: 'Target Stage', children: [f({ key: 'slug', label: 'Stage Slug' }), f({ key: 'name', label: 'Stage Name' })] },
      f({ key: 'body', label: 'Body' }),
      { key: 'member', label: 'Member', children: [f({ key: 'id', label: 'Member ID' }), f({ key: 'name', label: 'Name' })] },
      f({ key: 'created_at', label: 'Created At', format: 'datetime' }),
    ],
  }),
  accounts: plainList({
    key: 'accounts',
    label: 'Accounts',
    labelKey: 'name',
    itemFields: [
      f({ key: 'id', label: 'Account ID' }),
      f({ key: 'name', label: 'Name' }),
      f({ key: 'subdomain', label: 'Subdomain' }),
      f({ key: 'description', label: 'Description' }),
      f({ key: 'website_url', label: 'Website URL', format: 'url' }),
    ],
  }),
  moved: {
    fields: [
      f({ key: 'success', label: 'Success', format: 'boolean' }),
      f({ key: 'candidate_id', label: 'Candidate ID' }),
      f({ key: 'target_stage', label: 'Target Stage' }),
    ],
  } satisfies OutputSchema,
  rated: {
    fields: [
      f({ key: 'success', label: 'Success', format: 'boolean' }),
      f({ key: 'candidate_id', label: 'Candidate ID' }),
      f({ key: 'scale', label: 'Scale' }),
      f({ key: 'grade', label: 'Grade', format: 'number' }),
    ],
  } satisfies OutputSchema,
  commented: {
    fields: [f({ key: 'success', label: 'Success', format: 'boolean' }), f({ key: 'candidate_id', label: 'Candidate ID' })],
  } satisfies OutputSchema,
  disqualified: {
    fields: [
      f({ key: 'success', label: 'Success', format: 'boolean' }),
      f({ key: 'candidate_id', label: 'Candidate ID' }),
      f({ key: 'disqualified', label: 'Disqualified', format: 'boolean' }),
    ],
  } satisfies OutputSchema,
  tags: {
    fields: [
      f({ key: 'candidate_id', label: 'Candidate ID' }),
      { key: 'tags', label: 'Tags' },
      { key: 'added', label: 'Tags Added' },
    ],
  } satisfies OutputSchema,
  copied: {
    fields: [
      f({ key: 'source_candidate_id', label: 'Source Candidate ID' }),
      f({ key: 'target_job_shortcode', label: 'Target Job Shortcode' }),
      {
        key: 'candidate',
        label: 'Copied Candidate',
        children: [f({ key: 'id', label: 'New Candidate ID' }), f({ key: 'url', label: 'API URL', format: 'url' })],
      },
    ],
  } satisfies OutputSchema,
};
