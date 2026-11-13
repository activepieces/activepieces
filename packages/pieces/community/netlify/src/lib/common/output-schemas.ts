import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const deployFields: Fields = [
  { key: 'id', label: 'Deploy ID' },
  { key: 'site_id', label: 'Site ID' },
  { key: 'build_id', label: 'Build ID' },
  { key: 'state', label: 'State', description: 'e.g. new, enqueued, building, uploading, processing, ready, error, cancelled.' },
  { key: 'name', label: 'Site Name' },
  { key: 'title', label: 'Title' },
  { key: 'context', label: 'Context', description: 'production, deploy-preview or branch-deploy.' },
  { key: 'branch', label: 'Branch' },
  { key: 'commit_ref', label: 'Commit' },
  { key: 'commit_url', label: 'Commit URL', format: 'url' },
  { key: 'commit_message', label: 'Commit Message' },
  { key: 'error_message', label: 'Error Message' },
  { key: 'url', label: 'Site URL', format: 'url' },
  { key: 'ssl_url', label: 'Site HTTPS URL', format: 'url' },
  { key: 'deploy_url', label: 'Deploy URL', format: 'url' },
  { key: 'deploy_ssl_url', label: 'Deploy HTTPS URL', format: 'url' },
  { key: 'admin_url', label: 'Admin URL', format: 'url' },
  { key: 'screenshot_url', label: 'Screenshot', format: 'image' },
  { key: 'review_id', label: 'Pull Request Number', format: 'number' },
  { key: 'review_url', label: 'Pull Request URL', format: 'url' },
  { key: 'framework', label: 'Framework' },
  { key: 'locked', label: 'Locked', format: 'boolean' },
  { key: 'skipped', label: 'Skipped', format: 'boolean' },
  { key: 'manual_deploy', label: 'Manual Deploy', format: 'boolean' },
  { key: 'deploy_source', label: 'Source', description: 'e.g. api, drop or the Git provider.' },
  { key: 'deploy_time', label: 'Build Time (Seconds)', format: 'number' },
  { key: 'user_id', label: 'User ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
];

const siteFields: Fields = [
  { key: 'id', label: 'Site ID' },
  { key: 'name', label: 'Name' },
  { key: 'state', label: 'State' },
  { key: 'plan', label: 'Plan' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'ssl_url', label: 'HTTPS URL', format: 'url' },
  { key: 'admin_url', label: 'Admin URL', format: 'url' },
  { key: 'custom_domain', label: 'Custom Domain' },
  { key: 'domain_aliases', label: 'Domain Aliases' },
  { key: 'screenshot_url', label: 'Screenshot', format: 'image' },
  { key: 'account_id', label: 'Team ID' },
  { key: 'account_name', label: 'Team Name' },
  { key: 'account_slug', label: 'Team Slug' },
  { key: 'git_provider', label: 'Git Provider' },
  { key: 'force_ssl', label: 'Force HTTPS', format: 'boolean' },
  { key: 'managed_dns', label: 'Netlify DNS', format: 'boolean' },
  {
    key: 'build_settings',
    label: 'Build Settings',
    children: [
      { key: 'repo_url', label: 'Repository URL', format: 'url' },
      { key: 'repo_branch', label: 'Production Branch' },
      { key: 'cmd', label: 'Build Command' },
      { key: 'dir', label: 'Publish Directory' },
      { key: 'base', label: 'Base Directory' },
      { key: 'stop_builds', label: 'Builds Stopped', format: 'boolean' },
    ],
  },
  {
    key: 'published_deploy',
    label: 'Published Deploy',
    children: [
      { key: 'id', label: 'Deploy ID' },
      { key: 'state', label: 'State' },
      { key: 'branch', label: 'Branch' },
      { key: 'commit_ref', label: 'Commit' },
      { key: 'published_at', label: 'Published At', format: 'datetime' },
    ],
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const submissionFields: Fields = [
  { key: 'id', label: 'Submission ID' },
  { key: 'number', label: 'Number', format: 'number' },
  { key: 'form_id', label: 'Form ID' },
  { key: 'form_name', label: 'Form Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'name', label: 'Name' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'company', label: 'Company' },
  { key: 'summary', label: 'Summary' },
  { key: 'body', label: 'Message' },
  { key: 'title', label: 'Title' },
  { key: 'data', label: 'Submitted Fields', description: 'Every field by its name, plus ip, user_agent and referrer.', dynamicKey: true },
  { key: 'human_fields', label: 'Fields by Label', dynamicKey: true },
  { key: 'site_name', label: 'Site Name' },
  { key: 'site_url', label: 'Site URL', format: 'url' },
  { key: 'created_at', label: 'Submitted At', format: 'datetime' },
];

const envVarFields: Fields = [
  { key: 'key', label: 'Key' },
  { key: 'scopes', label: 'Scopes' },
  { key: 'is_secret', label: 'Secret', format: 'boolean' },
  {
    key: 'values',
    label: 'Values',
    listItems: [
      { key: 'id', label: 'Value ID' },
      { key: 'context', label: 'Deploy Context' },
      { key: 'context_parameter', label: 'Branch' },
      { key: 'value', label: 'Value', description: 'Masked for secret variables.' },
    ],
    labelKey: 'context',
  },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'updated_by', label: 'Updated By', children: [{ key: 'full_name', label: 'Name' }, { key: 'email', label: 'Email', format: 'email' }] },
];

function list({ label, item, itemLabel }: { label: string; item: Fields; itemLabel: string }): OutputSchema {
  return { fields: [{ key: 'items', value: '', label, listItems: item }], itemLabel };
}

export const netlifySchemas = {
  site: { fields: siteFields } satisfies OutputSchema,
  siteList: list({ label: 'Sites', item: siteFields, itemLabel: '{name}' }),
  deploy: { fields: deployFields } satisfies OutputSchema,
  deployList: list({ label: 'Deploys', item: deployFields, itemLabel: '{state} {created_at}' }),
  build: {
    fields: [
      { key: 'id', label: 'Build ID' },
      { key: 'deploy_id', label: 'Deploy ID', description: 'Pass it to Get Deploy to follow the build.' },
      { key: 'sha', label: 'Commit' },
      { key: 'done', label: 'Done', format: 'boolean' },
      { key: 'error', label: 'Error' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
    ],
  } satisfies OutputSchema,
  fileList: list({
    label: 'Files',
    item: [
      { key: 'id', label: 'File ID' },
      { key: 'path', label: 'Path' },
      { key: 'mime_type', label: 'MIME Type' },
      { key: 'size', label: 'Size', format: 'filesize' },
      { key: 'sha', label: 'SHA-1' },
      { key: 'deploy_id', label: 'Deploy ID' },
    ],
    itemLabel: '{path}',
  }),
  formList: list({
    label: 'Forms',
    item: [
      { key: 'id', label: 'Form ID' },
      { key: 'name', label: 'Name' },
      { key: 'site_id', label: 'Site ID' },
      { key: 'submission_count', label: 'Submissions', format: 'number' },
      { key: 'paths', label: 'Pages' },
      { key: 'fields', label: 'Fields', listItems: [{ key: 'name', label: 'Name' }, { key: 'type', label: 'Type' }], labelKey: 'name' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
    ],
    itemLabel: '{name}',
  }),
  submission: { fields: submissionFields } satisfies OutputSchema,
  submissionList: list({ label: 'Submissions', item: submissionFields, itemLabel: '#{number} {email}' }),
  envVarList: list({ label: 'Environment Variables', item: envVarFields, itemLabel: '{key}' }),
  envVarWrite: {
    fields: [
      { key: 'key', label: 'Key' },
      { key: 'created', label: 'Created', format: 'boolean', description: 'true when the variable did not exist before.' },
      { key: 'context', label: 'Deploy Context' },
      { key: 'scopes', label: 'Scopes' },
      { key: 'is_secret', label: 'Secret', format: 'boolean' },
      { key: 'contexts', label: 'Contexts With a Value' },
    ],
  } satisfies OutputSchema,
  envVarDelete: {
    fields: [
      { key: 'key', label: 'Key' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'already_deleted', label: 'Already Absent', format: 'boolean' },
    ],
  } satisfies OutputSchema,
};
