import { AppConnectionValueForAuthProperty, DropdownState, Property } from '@activepieces/pieces-framework';
import { insightlyClient, insightlyUtils } from './client';
import { insightlyAuth, insightlyCommon } from './common';

async function loadOptions({ auth, pod, path, label, value }: LoadOptionsParams): Promise<DropdownState<number>> {
  if (!auth) {
    return { disabled: true, placeholder: 'Connect your Insightly account first', options: [] };
  }
  try {
    const connection = await insightlyCommon.connect({ auth, pod });
    const { records, hasMore } = await insightlyClient.paginate({ apiKey: connection.apiKey, pod: connection.pod, path, query: { brief: 'true' }, limit: DROPDOWN_LIMIT });
    const options = records.flatMap((record) => {
      const id = insightlyUtils.readNumber(value(record));
      return id === null ? [] : [{ label: `${label(record) ?? `Record ${id}`} (ID: ${id})`, value: id }];
    });
    return {
      disabled: false,
      options,
      placeholder: hasMore ? `Showing the first ${DROPDOWN_LIMIT}; map an ID from a previous step for others` : undefined,
    };
  } catch (error) {
    return { disabled: true, placeholder: error instanceof Error ? error.message : 'Could not load options', options: [] };
  }
}

function recordDropdown({ displayName, description }: { displayName: string; description: string }) {
  return Property.Dropdown<number, true, typeof insightlyAuth>({
    auth: insightlyAuth,
    displayName,
    description,
    required: true,
    refreshers: ['objectName', 'pod'],
    options: async ({ auth, objectName, pod }) => {
      if (typeof objectName !== 'string' || !insightlyCommon.objectIdKeys[objectName]) {
        return { disabled: true, placeholder: 'Select an object type first', options: [] };
      }
      return loadOptions({
        auth,
        pod,
        path: `/${objectName}`,
        label: insightlyCommon.recordNameOf,
        value: (record) => insightlyCommon.recordIdOf({ record, objectName }),
      });
    },
  });
}

function userDropdown({ displayName }: { displayName: string }) {
  return Property.Dropdown<number, false, typeof insightlyAuth>({
    auth: insightlyAuth,
    displayName,
    required: false,
    refreshers: ['pod'],
    options: async ({ auth, pod }) =>
      loadOptions({ auth, pod, path: '/Users', label: insightlyCommon.recordNameOf, value: (record) => record['USER_ID'] }),
  });
}

function taskCategoryDropdown() {
  return Property.Dropdown<number, false, typeof insightlyAuth>({
    auth: insightlyAuth,
    displayName: 'Category',
    required: false,
    refreshers: ['pod'],
    options: async ({ auth, pod }) =>
      loadOptions({ auth, pod, path: '/TaskCategories', label: (record) => insightlyUtils.readString(record['CATEGORY_NAME']), value: (record) => record['CATEGORY_ID'] }),
  });
}

function projectDropdown() {
  return Property.Dropdown<number, false, typeof insightlyAuth>({
    auth: insightlyAuth,
    displayName: 'Project',
    required: false,
    refreshers: ['pod'],
    options: async ({ auth, pod }) =>
      loadOptions({ auth, pod, path: '/Projects', label: (record) => insightlyUtils.readString(record['PROJECT_NAME']), value: (record) => record['PROJECT_ID'] }),
  });
}

function opportunityDropdown() {
  return Property.Dropdown<number, true, typeof insightlyAuth>({
    auth: insightlyAuth,
    displayName: 'Opportunity',
    required: true,
    refreshers: ['pod'],
    options: async ({ auth, pod }) =>
      loadOptions({ auth, pod, path: '/Opportunities', label: (record) => insightlyUtils.readString(record['OPPORTUNITY_NAME']), value: (record) => record['OPPORTUNITY_ID'] }),
  });
}

function opportunityPipelineDropdown() {
  return Property.Dropdown<number, true, typeof insightlyAuth>({
    auth: insightlyAuth,
    displayName: 'Pipeline',
    required: true,
    refreshers: ['pod'],
    options: async ({ auth, pod }) => {
      const state = await loadOptions({
        auth,
        pod,
        path: '/Pipelines',
        label: (record) => (record['FOR_OPPORTUNITIES'] === false ? null : insightlyUtils.readString(record['PIPELINE_NAME'])),
        value: (record) => (record['FOR_OPPORTUNITIES'] === false ? null : record['PIPELINE_ID']),
      });
      return state;
    },
  });
}

function stageDropdown() {
  return Property.Dropdown<number, true, typeof insightlyAuth>({
    auth: insightlyAuth,
    displayName: 'Stage',
    required: true,
    refreshers: ['pod', 'pipelineId'],
    options: async ({ auth, pod, pipelineId }) => {
      const pipeline = insightlyUtils.readNumber(pipelineId);
      if (pipeline === null) {
        return { disabled: true, placeholder: 'Select a pipeline first', options: [] };
      }
      const state = await loadOptions({
        auth,
        pod,
        path: '/PipelineStages',
        label: (record) => insightlyUtils.readString(record['STAGE_NAME']),
        value: (record) => (insightlyUtils.readNumber(record['PIPELINE_ID']) === pipeline ? record['STAGE_ID'] : null),
      });
      return state;
    },
  });
}

type LoadOptionsParams = {
  auth: AppConnectionValueForAuthProperty<typeof insightlyAuth> | undefined;
  pod: unknown;
  path: string;
  label: (record: Record<string, unknown>) => string | null;
  value: (record: Record<string, unknown>) => unknown;
};

const DROPDOWN_LIMIT = 500;

export const insightlyDropdowns = {
  recordDropdown,
  userDropdown,
  taskCategoryDropdown,
  projectDropdown,
  opportunityDropdown,
  opportunityPipelineDropdown,
  stageDropdown,
};
