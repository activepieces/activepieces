import { Property } from '@activepieces/pieces-framework';
import { NinjaPipeRecord } from './client';
import { ninjapipeFields } from './fields';
import { ninjapipeProps } from './props';

function itemProps() {
  return {
    description: Property.LongText({ displayName: 'Description', required: false }),
    value: Property.Number({ displayName: 'Value', required: false }),
    priority: ninjapipeProps.staticDropdown({ displayName: 'Priority', description: 'Item priority.', values: ITEM_PRIORITIES }),
    assignedTo: ninjapipeProps.member({ displayName: 'Assigned To', description: 'Workspace member responsible for the item.' }),
    dueDate: Property.DateTime({ displayName: 'Due Date', description: 'Date (YYYY-MM-DD).', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    company: Property.ShortText({ displayName: 'Company', description: 'Company name shown on the card.', required: false }),
    tags: Property.Array({ displayName: 'Tags', required: false }),
  };
}

function itemBody(p: ItemInput): NinjaPipeRecord {
  return ninjapipeFields.compact({
    title: p.title,
    stage_id: p.stageId,
    description: p.description,
    value: ninjapipeFields.toNumber({ value: p.value, field: 'Value' }),
    priority: p.priority,
    assigned_to: p.assignedTo,
    due_date: ninjapipeFields.toDateOnly({ value: p.dueDate, field: 'Due Date' }),
    email: p.email,
    phone: p.phone,
    company: p.company,
    tags: ninjapipeFields.toStringList(p.tags),
  });
}

const ITEM_PRIORITIES = ['low', 'medium', 'high'];
const ITEM_CLEARABLE: Record<string, string> = {
  description: 'Description',
  assigned_to: 'Assigned To',
  due_date: 'Due Date',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
};

export const ninjapipeItems = { itemProps, itemBody, ITEM_PRIORITIES, ITEM_CLEARABLE };

export type ItemInput = {
  title?: unknown;
  stageId?: unknown;
  description?: unknown;
  value?: unknown;
  priority?: unknown;
  assignedTo?: unknown;
  dueDate?: unknown;
  email?: unknown;
  phone?: unknown;
  company?: unknown;
  tags?: unknown;
};
