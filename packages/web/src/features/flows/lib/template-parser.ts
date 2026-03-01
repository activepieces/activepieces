import { FlowVersionTemplate, Template } from '@activepieces/shared';

export const templateUtils = {
  parseTemplate: (jsonString: string): Template | null => {
    try {
      const parsed = JSON.parse(jsonString);
      let template: Template;

      if (
        parsed.flows &&
        Array.isArray(parsed.flows) &&
        parsed.flows.length > 0
      ) {
        template = parsed as Template;
      } else if (parsed.template && parsed.name) {
        template = {
          ...parsed,
          flows: [parsed.template],
        } as Template;
        delete (template as any).template;
      } else {
        return null;
      }

      const { flows, name } = template;
      if (!flows?.[0] || !name || !flows[0].trigger) {
        return null;
      }

      return template;
    } catch {
      return null;
    }
  },

  extractFlow: (jsonString: string): FlowVersionTemplate | null => {
    try {
      const parsed = JSON.parse(jsonString);

      if (
        parsed.flows &&
        Array.isArray(parsed.flows) &&
        parsed.flows.length > 0
      ) {
        return parsed.flows[0] as FlowVersionTemplate;
      } else if (parsed.template) {
        return parsed.template as FlowVersionTemplate;
      }

      return null;
    } catch {
      return null;
    }
  },
};
