import { Property } from '@activepieces/pieces-framework';
import {
  ApitemplateAuthConfig,
  ApitemplateRegion,
  makeRequest,
} from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { ApitemplateAuth } from './auth';

export const regionDropdown = Property.StaticDropdown({
  displayName: 'Region',
  description: 'Select your preferred API region for better performance',
  required: true,
  defaultValue: 'default',
  options: {
    options: [
      {
        label: 'Default (Singapore)',
        value: 'default',
      },
      {
        label: 'Europe (Frankfurt)',
        value: 'europe',
      },
      {
        label: 'US East (N. Virginia)',
        value: 'us',
      },
      {
        label: 'Australia (Sydney)',
        value: 'australia',
      },
      {
        label: 'Alternative - Default (Singapore)',
        value: 'alt-default',
      },
      {
        label: 'Alternative - Europe (Frankfurt)',
        value: 'alt-europe',
      },
      {
        label: 'Alternative - US East (N. Virginia)',
        value: 'alt-us',
      },
    ],
  },
});

export const templateIdDropdown = Property.Dropdown({
  auth: ApitemplateAuth,
  displayName: 'Template',
  description: 'The template to fill in.',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    const authConfig = auth.props;

    if (!authConfig.apiKey || !authConfig.region) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.GET,
        '/list-templates',
        undefined,
        undefined,
        authConfig.region as ApitemplateRegion
      );

      const templates = readTemplates(response);

      if (templates.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No templates found',
        };
      }

      return {
        disabled: false,
        options: templates.map((template) => ({
          label: buildTemplateLabel(template),
          value: template.template_id,
        })),
      };
    } catch (error) {
      console.error('Error loading templates:', error);
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not load templates',
      };
    }
  },
});

export const pdfTemplateIdDropdown = Property.Dropdown({
  auth: ApitemplateAuth,
  displayName: 'Template ID',
  description: 'Only PDF templates are shown; this endpoint does not support image templates.',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    const authConfig = auth.props;

    if (!authConfig.apiKey || !authConfig.region) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please complete authentication setup.',
      };
    }

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.GET,
        '/list-templates?format=PDF',
        undefined,
        undefined,
        authConfig.region as ApitemplateRegion
      );

      const templates = response?.templates || [];

      if (!Array.isArray(templates) || templates.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No PDF templates found',
        };
      }

      return {
        disabled: false,
        options: templates.map((template: any) => ({
          label: `${template.name} - ${template.status}`,
          value: template.template_id,
        })),
      };
    } catch (error) {
      console.error('Error loading templates:', error);
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading templates',
      };
    }
  },
});

export const transactionRefDropdown = Property.Dropdown({
  auth: ApitemplateAuth,
  displayName: 'File',
  description: 'The generated PDF or image to delete.',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    const authConfig = auth.props;

    if (!authConfig.apiKey || !authConfig.region) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        authConfig.apiKey,
        HttpMethod.GET,
        '/list-objects',
        undefined,
        undefined,
        authConfig.region as ApitemplateRegion
      );

      const files = readFiles(response);

      if (files.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No generated files found',
        };
      }

      return {
        disabled: false,
        options: files.map((file) => ({
          label: buildFileLabel(file),
          value: file.transaction_ref,
        })),
      };
    } catch (error) {
      console.error('Error loading transaction references:', error);
      return {
        disabled: true,
        options: [],
        placeholder: 'Could not load files',
      };
    }
  },
});

function buildTemplateLabel(template: TemplateSummary): string {
  const format =
    typeof template.format === 'string' ? ` (${template.format})` : '';
  const status =
    typeof template.status === 'string' ? ` - ${template.status}` : '';
  return `${template.name}${format}${status}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readTemplates(response: unknown): TemplateSummary[] {
  if (!isRecord(response) || !Array.isArray(response['templates'])) {
    return [];
  }
  return response['templates'].filter(isTemplateSummary);
}

function isTemplateSummary(value: unknown): value is TemplateSummary {
  return (
    isRecord(value) &&
    typeof value['template_id'] === 'string' &&
    typeof value['name'] === 'string'
  );
}

function readFiles(response: unknown): GeneratedFile[] {
  if (!isRecord(response) || !Array.isArray(response['objects'])) {
    return [];
  }
  return response['objects'].filter(isGeneratedFile);
}

function isGeneratedFile(value: unknown): value is GeneratedFile {
  return (
    isRecord(value) &&
    typeof value['transaction_ref'] === 'string' &&
    value['transaction_ref'] !== '' &&
    !value['deleted_at']
  );
}

function buildFileLabel(file: GeneratedFile): string {
  const name =
    typeof file.meta === 'string' && file.meta !== ''
      ? file.meta
      : file.transaction_ref;
  if (typeof file.created_at !== 'string' || file.created_at === '') {
    return name;
  }
  return `${name} · ${file.created_at.slice(0, 16).replace('T', ' ')}`;
}

interface TemplateSummary {
  template_id: string;
  name: string;
  format?: unknown;
  status?: unknown;
}

interface GeneratedFile {
  transaction_ref: string;
  meta?: unknown;
  created_at?: unknown;
  deleted_at?: unknown;
}
