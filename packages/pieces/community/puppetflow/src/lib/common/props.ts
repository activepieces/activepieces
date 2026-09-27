import {
  AppConnectionValueForAuthProperty,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { puppetflowAuth } from '../auth';
import {
  flowPath,
  PuppetflowCredentials,
  PuppetflowFlow,
  PuppetflowFlowInputDefinition,
  puppetflowRequest,
  PuppetflowRun,
} from './client';

export type PuppetflowAuthValue = AppConnectionValueForAuthProperty<
  typeof puppetflowAuth
>;

export function credentialsOf(auth: PuppetflowAuthValue): PuppetflowCredentials {
  return {
    instanceUrl: auth.props.instanceUrl,
    apiKey: auth.props.apiKey,
  };
}

const RUN_STATUS_OPTIONS = [
  { label: 'Pending', value: 'pending' },
  { label: 'Running', value: 'running' },
  { label: 'Success', value: 'success' },
  { label: 'Error', value: 'error' },
  { label: 'Cancelled', value: 'cancelled' },
];

function buildFlowDropdown<R extends boolean>(required: R) {
  return Property.Dropdown<string, R, typeof puppetflowAuth>({
    auth: puppetflowAuth,
    displayName: 'Flow',
    description: 'Select a Puppetflow flow, or type to search',
    required,
    refreshers: ['auth'],
    refreshOnSearch: true,
    options: async ({ auth }, context) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Connect your Puppetflow instance first',
        };
      }
      try {
        const flows = await puppetflowRequest<PuppetflowFlow[]>({
          credentials: credentialsOf(auth),
          method: HttpMethod.GET,
          path: '/flows',
          query: { search: context.searchValue, limit: 100 },
        });
        return {
          disabled: false,
          options: flows.map((flow) => ({
            label: flow.name || flow.id,
            value: flow.id,
          })),
          placeholder: flows.length === 0 ? 'No flows found' : 'Select a flow',
        };
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          disabled: true,
          options: [],
          placeholder: `Could not load flows: ${message}`,
        };
      }
    },
  });
}

export const flowIdDropdown = buildFlowDropdown(true);

export const optionalFlowIdDropdown = buildFlowDropdown(false);

export const runIdDropdown = Property.Dropdown({
  auth: puppetflowAuth,
  displayName: 'Run',
  description: 'Select a run of the chosen flow, or type a run ID to search',
  required: true,
  refreshers: ['auth', 'flowId'],
  refreshOnSearch: true,
  options: async ({ auth, flowId }, context) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Puppetflow instance first',
      };
    }
    if (!flowId) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Select a flow first',
      };
    }
    try {
      const runs = await puppetflowRequest<PuppetflowRun[]>({
        credentials: credentialsOf(auth),
        method: HttpMethod.GET,
        path: `${flowPath(flowId as string)}/runs/search`,
        query: { search: context.searchValue },
      });
      return {
        disabled: false,
        options: runs.map((run) => ({
          label: `#${run.id} (${run.status}${
            run.created_at ? `, ${run.created_at}` : ''
          })`,
          value: String(run.id),
        })),
        placeholder: runs.length === 0 ? 'No runs found' : 'Select a run',
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        options: [],
        placeholder: `Could not load runs: ${message}`,
      };
    }
  },
});

export const runStatusDropdown = Property.StaticDropdown({
  displayName: 'Status',
  description: 'Only return runs with this status',
  required: false,
  options: {
    disabled: false,
    options: RUN_STATUS_OPTIONS,
  },
});

export const runStatusesDropdown = Property.StaticMultiSelectDropdown({
  displayName: 'Statuses',
  description: 'Only return runs with one of these statuses',
  required: false,
  options: {
    disabled: false,
    options: RUN_STATUS_OPTIONS,
  },
});

export const artifactTypeDropdown = Property.StaticDropdown({
  displayName: 'Artifact Type',
  required: true,
  defaultValue: 'screenshots',
  options: {
    disabled: false,
    options: [
      { label: 'Screenshots', value: 'screenshots' },
      { label: 'Downloads', value: 'downloads' },
    ],
  },
});

export const includeLogsCheckbox = Property.Checkbox({
  displayName: 'Include Console Logs',
  description: 'Include console_logs in the response',
  required: false,
  defaultValue: false,
});

export const includeCodeCheckbox = Property.Checkbox({
  displayName: 'Include Code Snapshot',
  description: 'Include code_snapshot in the response',
  required: false,
  defaultValue: false,
});

type FlowInputField = {
  name: string;
  type: string;
  defaultValue: unknown;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function inferType(value: unknown): string {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (isPlainObject(value)) return 'object';
  return 'string';
}

function fieldsOfFlow(flow: PuppetflowFlow): FlowInputField[] {
  const definitions = Array.isArray(flow.input_definitions)
    ? flow.input_definitions.filter(
        (definition): definition is PuppetflowFlowInputDefinition =>
          typeof definition?.name === 'string'
      )
    : [];

  if (definitions.length > 0) {
    return definitions.map((definition) => ({
      name: definition.name,
      type:
        typeof definition.type === 'string' && definition.type.length > 0
          ? definition.type
          : inferType(definition.default),
      defaultValue: definition.default,
    }));
  }

  if (isPlainObject(flow.default_inputs)) {
    return Object.entries(flow.default_inputs).map(([name, value]) => ({
      name,
      type: inferType(value),
      defaultValue: value,
    }));
  }

  return [];
}

function fieldLabel(field: FlowInputField): string {
  switch (field.type) {
    case 'channel':
      return `${field.name} (Channel ID)`;
    case 'mailbox-watcher':
      return `${field.name} (Mailbox Watcher ID)`;
    case 'ai-model':
      return `${field.name} (AI Model ID)`;
    default:
      return field.name;
  }
}

function fieldDescription(field: FlowInputField): string {
  const parts = [`Type: ${field.type}.`];
  if (field.defaultValue !== undefined && field.defaultValue !== null) {
    parts.push(`Default: ${JSON.stringify(field.defaultValue)}.`);
  }
  parts.push('Leave empty to keep the flow default.');
  return parts.join(' ');
}

export const flowInputsProperty = Property.DynamicProperties({
  auth: puppetflowAuth,
  displayName: 'Flow Inputs',
  description: 'Input values declared by the selected flow',
  required: false,
  refreshers: ['auth', 'flowId'],
  props: async ({ auth, flowId }) => {
    if (!auth || !flowId) {
      return {};
    }

    let flow: PuppetflowFlow;
    try {
      flow = await puppetflowRequest<PuppetflowFlow>({
        credentials: credentialsOf(auth),
        method: HttpMethod.GET,
        path: flowPath(flowId as string),
      });
    } catch {
      return {};
    }

    const props: DynamicPropsValue = {};
    for (const field of fieldsOfFlow(flow)) {
      if (field.type === 'object' || field.type === 'array') {
        props[field.name] = Property.Json({
          displayName: fieldLabel(field),
          description: fieldDescription(field),
          required: false,
        });
        continue;
      }
      props[field.name] = Property.ShortText({
        displayName: fieldLabel(field),
        description: fieldDescription(field),
        required: false,
      });
    }
    return props;
  },
});

function coerceInputValue(value: unknown, type: string | undefined): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  if (type === 'number' && trimmed !== '' && !Number.isNaN(Number(trimmed))) {
    return Number(trimmed);
  }
  if (type === 'boolean') {
    if (['true', '1', 'yes'].includes(trimmed.toLowerCase())) return true;
    if (['false', '0', 'no'].includes(trimmed.toLowerCase())) return false;
  }
  if ((type === 'object' || type === 'array') && trimmed !== '') {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }
  return value;
}

export async function buildFlowInput(params: {
  credentials: PuppetflowCredentials;
  flowId: string;
  flowInputs: Record<string, unknown> | undefined;
  additionalInput: Record<string, unknown> | undefined;
}): Promise<Record<string, unknown>> {
  const { credentials, flowId, flowInputs, additionalInput } = params;
  const body: Record<string, unknown> = {};

  const providedInputs = Object.entries(flowInputs ?? {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== ''
  );

  if (providedInputs.length > 0) {
    let types: Record<string, string> = {};
    try {
      const flow = await puppetflowRequest<PuppetflowFlow>({
        credentials,
        method: HttpMethod.GET,
        path: flowPath(flowId),
      });
      types = Object.fromEntries(
        fieldsOfFlow(flow).map((field) => [field.name, field.type])
      );
    } catch {
      types = {};
    }
    for (const [key, value] of providedInputs) {
      body[key] = coerceInputValue(value, types[key]);
    }
  }

  if (isPlainObject(additionalInput)) {
    Object.assign(body, additionalInput);
  }

  return body;
}
