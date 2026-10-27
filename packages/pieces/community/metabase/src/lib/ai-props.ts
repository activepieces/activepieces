import { Property } from '@activepieces/pieces-framework';

function cardId<R extends boolean>({
  required,
  displayName = 'Card ID',
  description = 'Numeric ID of the question (card or model). Get it from List Cards or Search.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function dashboardId<R extends boolean>({
  required,
  displayName = 'Dashboard ID',
  description = 'Numeric ID of the dashboard. Get it from List Dashboards or Search.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function collectionId<R extends boolean>({
  required,
  displayName = 'Collection ID',
  description = 'Numeric ID of the collection. Get it from List Collections. Empty = the root collection ("Our analytics").',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function parameterId<R extends boolean>({
  required,
  displayName = 'Parameter ID',
  description = "The filter parameter's `id` (not its slug), from the `parameters` list returned by Get Card or Get Dashboard.",
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function databaseId<R extends boolean>({
  required,
  displayName = 'Database ID',
  description = 'Numeric ID of the connected database. Get it from List Databases.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function tableId<R extends boolean>({
  required,
  displayName = 'Table ID',
  description = 'Numeric ID of the table. Get it from List Tables, List Schema Tables or Search.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function fieldId<R extends boolean>({
  required,
  displayName = 'Field ID',
  description = 'Numeric ID of the field (column). Get it from Get Table Metadata or List Database Fields.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function userId<R extends boolean>({
  required,
  displayName = 'User ID',
  description = 'Numeric ID of the Metabase user. Get it from List Users or Get Current User.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function groupId<R extends boolean>({
  required,
  displayName = 'Group ID',
  description = 'Numeric ID of the permission group. Get it from List Groups.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function alertId<R extends boolean>({
  required,
  displayName = 'Alert ID',
  description = 'Numeric ID of the alert (notification). Get it from List Alerts.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function subscriptionId<R extends boolean>({
  required,
  displayName = 'Subscription ID',
  description = 'Numeric ID of the dashboard subscription. Get it from List Dashboard Subscriptions.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function timelineId<R extends boolean>({
  required,
  displayName = 'Timeline ID',
  description = 'Numeric ID of the timeline. Get it from List Timelines.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function timelineEventId<R extends boolean>({
  required,
  displayName = 'Event ID',
  description = 'Numeric ID of the timeline event. Get it from Get Timeline (with events).',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function snippetId<R extends boolean>({
  required,
  displayName = 'Snippet ID',
  description = 'Numeric ID of the SQL snippet. Get it from List Snippets.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function segmentId<R extends boolean>({
  required,
  displayName = 'Segment ID',
  description = 'Numeric ID of the segment. Get it from List Segments.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function glossaryId<R extends boolean>({
  required,
  displayName = 'Glossary Entry ID',
  description = 'Numeric ID of the glossary entry. Get it from List Glossary Entries.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function documentId<R extends boolean>({
  required,
  displayName = 'Document ID',
  description = 'Numeric ID of the document. Get it from List Documents or Search.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function actionId<R extends boolean>({
  required,
  displayName = 'Action ID',
  description = 'Numeric ID of the Metabase action. Get it from List Actions.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function yesNo<R extends boolean>({
  required,
  displayName,
  description,
}: PropParams<R> & { displayName: string }) {
  return Property.StaticDropdown<boolean, R>({
    displayName,
    description,
    required,
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
  });
}

export const metabaseAiProps = {
  cardId,
  dashboardId,
  collectionId,
  parameterId,
  databaseId,
  tableId,
  fieldId,
  userId,
  groupId,
  alertId,
  subscriptionId,
  timelineId,
  timelineEventId,
  snippetId,
  segmentId,
  glossaryId,
  documentId,
  actionId,
  yesNo,
};

export type PropParams<R extends boolean> = {
  required: R;
  displayName?: string;
  description?: string;
};
