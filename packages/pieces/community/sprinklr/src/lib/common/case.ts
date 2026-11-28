import { HttpMethod } from '@activepieces/pieces-common';
import { OutputSchema } from '@activepieces/pieces-framework';
import { sprinklrClient, SprinklrAuthValue } from './client';
import { sprinklrEndpoints } from './endpoints';
import { SprinklrApiError, sprinklrErrors } from './errors';

function record(value: unknown): Record<string, unknown> | null {
  return sprinklrErrors.isRecord(value) ? value : null;
}

function text(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function bool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function normalizeContact(value: unknown): SprinklrCaseContact | null {
  const contact = record(value);
  if (!contact) {
    return null;
  }
  return {
    id: text(contact['id']),
    name: text(contact['name']),
    channelType: text(contact['channelType']),
    channelId: text(contact['channelId']),
  };
}

function normalizeAssignment(value: unknown): SprinklrCaseAssignment | null {
  const assignment = record(value);
  if (!assignment) {
    return null;
  }
  return {
    assigneeId: text(assignment['assigneeId']),
    assigneeType: text(assignment['assigneeType']),
    assignedById: text(assignment['assignedById']),
    assignmentTime: num(assignment['assignmentTime']),
  };
}

function normalizeQueues(value: unknown): SprinklrCaseQueue[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  return value.map((item) => {
    const queue = record(item) ?? {};
    return { queueId: text(queue['queueId']), assignmentTime: num(queue['assignmentTime']) };
  });
}

function normalizeWorkflow(value: unknown): SprinklrCaseWorkflow | null {
  const workflow = record(value);
  if (!workflow) {
    return null;
  }
  return {
    assignment: normalizeAssignment(workflow['assignment']),
    customProperties: record(workflow['customProperties']),
    queues: normalizeQueues(workflow['queues']),
  };
}

function normalize(raw: unknown): SprinklrCaseOutput {
  const item = record(raw) ?? {};
  return {
    id: text(item['id']),
    caseNumber: num(item['caseNumber']),
    subject: text(item['subject']),
    description: text(item['description']),
    status: text(item['status']),
    priority: text(item['priority']),
    caseType: text(item['caseType']),
    version: num(item['version']),
    dueDate: num(item['dueDate']),
    summary: text(item['summary']),
    createdTime: num(item['createdTime']),
    modifiedTime: num(item['modifiedTime']),
    contact: normalizeContact(item['contact']),
    workflow: normalizeWorkflow(item['workflow']),
    firstMessageId: text(item['firstMessageId']),
    latestMessageId: text(item['latestMessageId']),
    sentiment: num(item['sentiment']),
    externalCase: record(item['externalCase']),
    deleted: bool(item['deleted']),
  };
}

function firstCase(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data[0];
  }
  const single = record(data);
  if (single && Array.isArray(single['results'])) {
    return single['results'][0];
  }
  return single && Object.keys(single).length > 0 ? single : undefined;
}

async function getOne({
  auth,
  query,
  notFoundMessage,
}: {
  auth: SprinklrAuthValue;
  query: Record<string, string>;
  notFoundMessage: string;
}): Promise<SprinklrCaseOutput> {
  let data: unknown;
  try {
    data = await sprinklrClient.request({ auth, method: HttpMethod.GET, path: sprinklrEndpoints.CASE, query });
  } catch (error) {
    if (error instanceof SprinklrApiError && error.kind === 'not_found') {
      throw new Error(notFoundMessage);
    }
    throw error;
  }
  const found = firstCase(data);
  if (!record(found)) {
    throw new Error(notFoundMessage);
  }
  return normalize(found);
}

async function getByNumber({ auth, caseNumber }: { auth: SprinklrAuthValue; caseNumber: string | number }): Promise<SprinklrCaseOutput> {
  const value = String(caseNumber).trim();
  return getOne({
    auth,
    query: { caseNumber: value },
    notFoundMessage: `No Sprinklr case has number ${value}. Check the case number.`,
  });
}

async function getById({ auth, id }: { auth: SprinklrAuthValue; id: string }): Promise<SprinklrCaseOutput> {
  const value = id.trim();
  return getOne({
    auth,
    query: { id: value },
    notFoundMessage: `No Sprinklr case has ID ${value}. Check the case ID.`,
  });
}

const caseFields: OutputSchema['fields'] = [
  { key: 'caseNumber', label: 'Case Number' },
  { key: 'id', label: 'Case ID' },
  { key: 'subject', label: 'Subject' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'caseType', label: 'Case Type' },
  { key: 'summary', label: 'Summary' },
  { key: 'dueDate', label: 'Due Date', description: 'Epoch milliseconds' },
  { key: 'createdTime', label: 'Created Time', description: 'Epoch milliseconds' },
  { key: 'modifiedTime', label: 'Modified Time', description: 'Epoch milliseconds' },
  { key: 'version', label: 'Version', format: 'number' },
  {
    key: 'contact',
    label: 'Contact',
    children: [
      { key: 'id', label: 'Contact ID' },
      { key: 'name', label: 'Name' },
      { key: 'channelType', label: 'Channel Type' },
      { key: 'channelId', label: 'Channel ID' },
    ],
  },
  {
    key: 'workflow',
    label: 'Workflow',
    children: [
      {
        key: 'assignment',
        label: 'Assignment',
        children: [
          { key: 'assigneeId', label: 'Assignee ID' },
          { key: 'assigneeType', label: 'Assignee Type' },
          { key: 'assignedById', label: 'Assigned By ID' },
          { key: 'assignmentTime', label: 'Assignment Time', description: 'Epoch milliseconds' },
        ],
      },
      { key: 'customProperties', label: 'Custom Fields', dynamicKey: true },
      {
        key: 'queues',
        label: 'Queues',
        labelKey: 'queueId',
        listItems: [
          { key: 'queueId', label: 'Queue ID' },
          { key: 'assignmentTime', label: 'Assignment Time', description: 'Epoch milliseconds' },
        ],
      },
    ],
  },
  { key: 'firstMessageId', label: 'First Message ID' },
  { key: 'latestMessageId', label: 'Latest Message ID' },
  { key: 'sentiment', label: 'Sentiment', format: 'number' },
  { key: 'externalCase', label: 'External Case' },
  { key: 'deleted', label: 'Deleted', format: 'boolean' },
];

const outputSchema: OutputSchema = { fields: caseFields };

const sampleData: SprinklrCaseOutput = {
  id: '6650f1c2a8b4e91d2c3f0a11',
  caseNumber: 120000123,
  subject: '#120000123 Email Order arrived damaged',
  description: 'The customer says the parcel arrived with a broken lid.',
  status: 'Open',
  priority: 'High',
  caseType: 'Complaint',
  version: 2,
  dueDate: 1763337600000,
  summary: 'Damaged delivery, replacement requested.',
  createdTime: 1763200800000,
  modifiedTime: 1763204400000,
  contact: {
    id: 'EMAIL_jane.doe@example.com',
    name: 'Jane Doe',
    channelType: 'EMAIL',
    channelId: 'jane.doe@example.com',
  },
  workflow: {
    assignment: {
      assigneeId: '60000123',
      assigneeType: 'USER',
      assignedById: '60000001',
      assignmentTime: 1763202600000,
    },
    customProperties: { order_number_cf: ['A-10045'] },
    queues: [{ queueId: '5001', assignmentTime: 1763200800000 }],
  },
  firstMessageId: 'MSG_120000123_1',
  latestMessageId: 'MSG_120000123_3',
  sentiment: -1,
  externalCase: null,
  deleted: false,
};

export const sprinklrCase = {
  normalize,
  outputSchema,
  fields: caseFields,
  sampleData,
  getByNumber,
  getById,
};

export type SprinklrCaseContact = {
  id: string | null;
  name: string | null;
  channelType: string | null;
  channelId: string | null;
};

export type SprinklrCaseAssignment = {
  assigneeId: string | null;
  assigneeType: string | null;
  assignedById: string | null;
  assignmentTime: number | null;
};

export type SprinklrCaseQueue = {
  queueId: string | null;
  assignmentTime: number | null;
};

export type SprinklrCaseWorkflow = {
  assignment: SprinklrCaseAssignment | null;
  customProperties: Record<string, unknown> | null;
  queues: SprinklrCaseQueue[] | null;
};

export type SprinklrCaseOutput = {
  id: string | null;
  caseNumber: number | null;
  subject: string | null;
  description: string | null;
  status: string | null;
  priority: string | null;
  caseType: string | null;
  version: number | null;
  dueDate: number | null;
  summary: string | null;
  createdTime: number | null;
  modifiedTime: number | null;
  contact: SprinklrCaseContact | null;
  workflow: SprinklrCaseWorkflow | null;
  firstMessageId: string | null;
  latestMessageId: string | null;
  sentiment: number | null;
  externalCase: Record<string, unknown> | null;
  deleted: boolean | null;
};
