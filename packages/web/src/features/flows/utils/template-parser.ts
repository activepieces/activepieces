import {
  FlowVersionTemplate,
  Template,
  TemplateStatus,
  TemplateType,
  apId,
  n8nWorkflowConverter,
} from '@activepieces/shared';

function parseTemplate(fileContent: string): Template | null {
  const parsed = parseJson({ value: fileContent });

  if (parsed === undefined) {
    return null;
  }

  const template = Template.safeParse(parsed);

  if (template.success && hasImportableFlow({ template: template.data })) {
    return template.data;
  }

  const legacyTemplate = parseLegacyTemplate({ value: parsed });

  if (legacyTemplate !== null) {
    return legacyTemplate;
  }

  const n8nWorkflow = n8nWorkflowConverter.isN8nWorkflow(parsed)
    ? n8nWorkflowConverter.convert({ workflow: parsed })
    : undefined;

  if (n8nWorkflow === undefined) {
    return null;
  }

  const n8nFlowTemplate = FlowVersionTemplate.safeParse({
    displayName: n8nWorkflow.request.displayName,
    trigger: n8nWorkflow.request.trigger,
    valid: false,
  });

  if (!n8nFlowTemplate.success) {
    return null;
  }

  return createTemplate({
    name: n8nWorkflow.request.displayName,
    flows: [n8nFlowTemplate.data],
  });
}

function extractFlow(fileContent: string): FlowVersionTemplate | null {
  const template = parseTemplate(fileContent);
  return template?.flows?.[0] ?? null;
}

function parseLegacyTemplate({
  value,
}: ParseLegacyTemplateParams): Template | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = getStringValue({ value: value['name'] });
  const flows = parseFlowVersionTemplates({ value: value['flows'] });

  if (name !== undefined && flows.length > 0) {
    return createTemplate({ name, flows });
  }

  const flowTemplate = parseFlowVersionTemplate({ value: value['template'] });

  if (name !== undefined && flowTemplate !== undefined) {
    return createTemplate({ name, flows: [flowTemplate] });
  }

  return null;
}

function parseFlowVersionTemplates({
  value,
}: ParseFlowVersionTemplatesParams): FlowVersionTemplate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((flow) => parseFlowVersionTemplate({ value: flow }))
    .filter(isDefined);
}

function parseFlowVersionTemplate({
  value,
}: ParseFlowVersionTemplateParams): FlowVersionTemplate | undefined {
  const flowTemplate = FlowVersionTemplate.safeParse(value);

  if (flowTemplate.success) {
    return flowTemplate.data;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  const nestedFlowTemplate = FlowVersionTemplate.safeParse(value['template']);
  return nestedFlowTemplate.success ? nestedFlowTemplate.data : undefined;
}

function createTemplate({ name, flows }: CreateTemplateParams): Template {
  const now = new Date().toISOString();
  return {
    id: apId(),
    created: now,
    updated: now,
    name,
    type: TemplateType.SHARED,
    summary: '',
    description: '',
    tags: [],
    author: 'Imported workflow',
    categories: [],
    pieces: [],
    flows,
    tables: [],
    status: TemplateStatus.PUBLISHED,
  };
}

function hasImportableFlow({ template }: HasImportableFlowParams): boolean {
  return (
    template.flows !== undefined &&
    template.flows.length > 0 &&
    template.flows[0]?.trigger !== undefined
  );
}

function parseJson({ value }: ParseJsonParams): unknown | undefined {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getStringValue({ value }: GetStringValueParams): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

export const templateUtils = {
  extractFlow,
  parseTemplate,
};

type ParseLegacyTemplateParams = {
  value: unknown;
};

type ParseFlowVersionTemplatesParams = {
  value: unknown;
};

type ParseFlowVersionTemplateParams = {
  value: unknown;
};

type CreateTemplateParams = {
  name: string;
  flows: FlowVersionTemplate[];
};

type HasImportableFlowParams = {
  template: Template;
};

type ParseJsonParams = {
  value: string;
};

type GetStringValueParams = {
  value: unknown;
};
