import { Property } from '@activepieces/pieces-framework';

function ticketId({ description }: { description?: string } = {}) {
  return requiredId({
    displayName: 'Ticket ID',
    description: description ?? 'Numeric ticket ID, from Search, List Tickets or Create Ticket.',
  });
}

function requiredId({ displayName, description }: { displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required: true });
}

function page() {
  return Property.Number({
    displayName: 'Page',
    description: 'Page number, starting at 1. Pass next_page from a previous call.',
    required: false,
  });
}

function limit() {
  return Property.Number({
    displayName: 'Limit',
    description: 'Records per page, 1 to 100. Defaults to 25.',
    required: false,
  });
}

function cursor() {
  return Property.ShortText({
    displayName: 'Cursor',
    description: 'The next_cursor value from a previous call, to fetch the next page.',
    required: false,
  });
}

function sortOrder() {
  return Property.StaticDropdown({
    displayName: 'Sort Order',
    description: 'asc for oldest first (default), desc for newest first.',
    required: false,
    options: {
      options: [
        { label: 'Oldest first', value: 'asc' },
        { label: 'Newest first', value: 'desc' },
      ],
    },
  });
}

function ticketStatus({ description }: { description: string }) {
  return Property.StaticDropdown({
    displayName: 'Status',
    description,
    required: false,
    options: {
      options: [
        { label: 'New', value: 'new' },
        { label: 'Open', value: 'open' },
        { label: 'Pending', value: 'pending' },
        { label: 'On-hold', value: 'hold' },
        { label: 'Solved', value: 'solved' },
        { label: 'Closed', value: 'closed' },
      ],
    },
  });
}

function ticketPriority() {
  return Property.StaticDropdown({
    displayName: 'Priority',
    required: false,
    options: {
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
      ],
    },
  });
}

function ticketType() {
  return Property.StaticDropdown({
    displayName: 'Type',
    description: 'incident requires Problem ID to link it to a problem ticket.',
    required: false,
    options: {
      options: [
        { label: 'Question', value: 'question' },
        { label: 'Incident', value: 'incident' },
        { label: 'Problem', value: 'problem' },
        { label: 'Task', value: 'task' },
      ],
    },
  });
}

function optionalId({ displayName, description }: { displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required: false });
}

function optionalBoolean({ displayName, description }: { displayName: string; description: string }) {
  return Property.StaticDropdown({
    displayName,
    description,
    required: false,
    options: {
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  });
}

function additionalFields({ description }: { description: string }) {
  return Property.Json({
    displayName: 'Additional Fields',
    description,
    required: false,
  });
}

export const zendeskAiProps = {
  ticketId,
  requiredId,
  limit,
  page,
  cursor,
  sortOrder,
  ticketStatus,
  ticketPriority,
  ticketType,
  optionalId,
  optionalBoolean,
  additionalFields,
};
