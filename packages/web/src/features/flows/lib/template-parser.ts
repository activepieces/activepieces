import {
  FlowVersionTemplate,
  Template,
  tryCatchSync,
} from '@activepieces/shared';

export const templateUtils = {
  parseTemplate: (jsonString: string): Template | null => {
    const { data: parsed, error } = tryCatchSync(() => JSON.parse(jsonString));
    if (error) {
      return null;
    }

    const template = toTemplate(parsed);
    if (!template?.name || !template.flows?.[0]) {
      return null;
    }

    return template;
  },

  extractFlow: (jsonString: string): FlowVersionTemplate | null => {
    const { data: parsed, error } = tryCatchSync(() => JSON.parse(jsonString));
    if (error) {
      return null;
    }

    return extractFirstFlow(parsed);
  },
};

function extractFirstFlow(parsed: unknown): FlowVersionTemplate | null {
  const obj = parsed as Record<string, unknown>;

  if (Array.isArray(obj.flows) && obj.flows.length > 0) {
    return obj.flows[0] as FlowVersionTemplate;
  }

  if (obj.template) {
    return obj.template as FlowVersionTemplate;
  }

  return null;
}

function toTemplate(parsed: unknown): Template | null {
  const obj = parsed as Record<string, unknown>;

  if (Array.isArray(obj.flows) && obj.flows.length > 0) {
    return obj as unknown as Template;
  }

  if (obj.template && obj.name) {
    const { template: _template, ...rest } = obj;
    return {
      ...rest,
      flows: [_template],
    } as unknown as Template;
  }

  return null;
}
