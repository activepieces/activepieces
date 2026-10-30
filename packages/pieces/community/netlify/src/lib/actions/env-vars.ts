import { createAction, Property } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifyOperations } from '../common/operations';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';

const CONTEXTS = [
  { label: 'All contexts', value: 'all' },
  { label: 'Production', value: 'production' },
  { label: 'Deploy previews', value: 'deploy-preview' },
  { label: 'Branch deploys', value: 'branch-deploy' },
  { label: 'Local development (netlify dev)', value: 'dev' },
];

function listFilters() {
  return {
    context: Property.StaticDropdown({
      displayName: 'Deploy Context',
      description: 'Only variables with a value for this context.',
      required: false,
      options: { options: CONTEXTS },
    }),
    scope: Property.StaticDropdown({
      displayName: 'Scope',
      description: 'Only variables available in this scope.',
      required: false,
      options: {
        options: [
          { label: 'Builds', value: 'builds' },
          { label: 'Functions', value: 'functions' },
          { label: 'Runtime', value: 'runtime' },
          { label: 'Post processing', value: 'post-processing' },
        ],
      },
    }),
  };
}

function setFields() {
  return {
    key: Property.ShortText({ displayName: 'Key', description: 'Variable name, e.g. API_URL (letters, digits and underscores).', required: true }),
    value: Property.LongText({ displayName: 'Value', required: true }),
    context: Property.StaticDropdown({
      displayName: 'Deploy Context',
      description: 'Which deploys get this value. All contexts replaces any per-context values. Defaults to all contexts.',
      required: false,
      defaultValue: 'all',
      options: { options: CONTEXTS },
    }),
    isSecret: Property.Checkbox({
      displayName: 'Secret',
      description: 'Only used when the variable is created: hide its value in the Netlify UI and API. Secret variables are available to builds, functions and runtime only and need a specific deploy context.',
      required: false,
      defaultValue: false,
    }),
  };
}

function keyField() {
  return Property.ShortText({ displayName: 'Key', description: 'The variable name to delete, e.g. API_URL.', required: true });
}

export const listEnvVars = createAction({
  auth: netlifyAuth,
  name: 'list_env_vars',
  classification: 'SEARCH',
  displayName: 'List Environment Variables',
  description: 'List the environment variables of a site.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists the environment variables of one Netlify site (site-level and team-level ones that apply to it) with key, scopes, secret flag and the value per deploy context; secret values come back empty. Optionally filter by deploy context or scope. Read-only.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.envVarList,
  props: { siteId: netlifyProps.siteDropdown({ description: 'The site whose variables to list.' }), ...listFilters() },
  async run({ auth, propsValue }) {
    return netlifyOperations.listEnvVars({ auth, siteId: propsValue.siteId, context: propsValue.context, scope: propsValue.scope });
  },
});

export const listEnvVarsById = createAction({
  auth: netlifyAuth,
  name: 'list_env_vars_by_id',
  classification: 'SEARCH',
  displayName: 'List Environment Variables by Site ID',
  description: 'List the environment variables of a site given its ID or domain.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the environment variables of one Netlify site (site-level and team-level ones that apply to it) with key, scopes, secret flag and the value per deploy context; secret values come back empty. Optionally filter by deploy context or scope. Read-only. Get the site ID from List Sites.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.envVarList,
  props: { siteId: netlifyProps.siteId(), ...listFilters() },
  async run({ auth, propsValue }) {
    return netlifyOperations.listEnvVars({ auth, siteId: propsValue.siteId, context: propsValue.context, scope: propsValue.scope });
  },
});

export const setEnvVar = createAction({
  auth: netlifyAuth,
  name: 'set_env_var',
  classification: 'WRITE',
  displayName: 'Set Environment Variable',
  description: 'Create an environment variable on a site or change its value.',
  audience: 'human',
  aiMetadata: {
    description:
      'Sets the value of one environment variable on a Netlify site for a deploy context (default all), creating the variable if it does not exist. Choosing all contexts replaces any per-context values with this one value; choosing one context changes only that context. Running it again with the same value changes nothing. The value is not returned. Takes effect on the next deploy (use Start Deploy).',
    idempotent: true,
  },
  outputSchema: netlifySchemas.envVarWrite,
  props: { siteId: netlifyProps.siteDropdown({ description: 'The site to set the variable on.' }), ...setFields() },
  async run({ auth, propsValue }) {
    return netlifyOperations.setEnvVar({ auth, siteId: propsValue.siteId, key: propsValue.key, value: propsValue.value, context: propsValue.context, isSecret: propsValue.isSecret });
  },
});

export const setEnvVarById = createAction({
  auth: netlifyAuth,
  name: 'set_env_var_by_id',
  classification: 'WRITE',
  displayName: 'Set Environment Variable by Site ID',
  description: 'Create or change an environment variable on a site given its ID or domain.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets the value of one environment variable on a Netlify site for a deploy context (default all), creating the variable if it does not exist. Choosing all contexts replaces any per-context values with this one value; choosing one context changes only that context. Running it again with the same value changes nothing. The value is not returned. Takes effect on the next deploy (use Start Deploy). Get the site ID from List Sites.',
    idempotent: true,
  },
  outputSchema: netlifySchemas.envVarWrite,
  props: { siteId: netlifyProps.siteId(), ...setFields() },
  async run({ auth, propsValue }) {
    return netlifyOperations.setEnvVar({ auth, siteId: propsValue.siteId, key: propsValue.key, value: propsValue.value, context: propsValue.context, isSecret: propsValue.isSecret });
  },
});

export const deleteEnvVar = createAction({
  auth: netlifyAuth,
  name: 'delete_env_var',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Environment Variable',
  description: 'Delete an environment variable from a site.',
  audience: 'human',
  aiMetadata: {
    description:
      'Deletes one environment variable (all its values in every context) from a Netlify site. Cannot be undone. If the key does not exist, returns already_deleted=true instead of failing. Takes effect on the next deploy.',
    idempotent: false,
  },
  outputSchema: netlifySchemas.envVarDelete,
  props: { siteId: netlifyProps.siteDropdown({ description: 'The site to delete the variable from.' }), key: keyField() },
  async run({ auth, propsValue }) {
    return netlifyOperations.deleteEnvVar({ auth, siteId: propsValue.siteId, key: propsValue.key });
  },
});

export const deleteEnvVarById = createAction({
  auth: netlifyAuth,
  name: 'delete_env_var_by_id',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Environment Variable by Site ID',
  description: 'Delete an environment variable from a site given its ID or domain.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one environment variable (all its values in every context) from a Netlify site. Cannot be undone. If the key does not exist, returns already_deleted=true instead of failing. Takes effect on the next deploy. Get the site ID from List Sites.',
    idempotent: false,
  },
  outputSchema: netlifySchemas.envVarDelete,
  props: { siteId: netlifyProps.siteId(), key: keyField() },
  async run({ auth, propsValue }) {
    return netlifyOperations.deleteEnvVar({ auth, siteId: propsValue.siteId, key: propsValue.key });
  },
});
