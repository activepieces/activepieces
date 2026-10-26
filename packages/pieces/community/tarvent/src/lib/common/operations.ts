import { tarventCommon } from '.';
import { tarventClient } from './client';
import { TarventCredentials, tarventTransport } from './transport';

async function setContactTags({
  auth,
  audienceId,
  contactId,
  tags,
  remove,
}: {
  auth: TarventCredentials;
  audienceId: unknown;
  contactId: unknown;
  tags: unknown;
  remove: boolean;
}) {
  const audience = tarventCommon.requireText({ value: audienceId, label: 'Audience' });
  const id = tarventCommon.requireText({ value: contactId, label: 'Contact ID' });
  const list = (Array.isArray(tags) ? tags : [])
    .map((tag) => tarventCommon.trimmed(tag))
    .filter((tag): tag is string => tag !== undefined);
  if (list.length === 0) {
    throw new Error('Enter at least one tag.');
  }
  if (list.length > 100) {
    throw new Error('Tarvent accepts at most 100 tags per call.');
  }
  const operator = remove ? 'REMOVE' : 'ADD';
  await tarventClient.booleanMutation({
    auth,
    operation: 'UpdateContactTags',
    field: 'updateContactTags',
    argDefs: '$input: UpdateContactTagsInput!',
    args: 'input: $input',
    variables: { input: { id, audienceId: audience, operator, tags: list } },
  });
  return { success: true, contactId: id, action: operator, tags: list };
}

async function setGroupMembership({
  auth,
  audienceId,
  groupId,
  contactId,
  add,
}: {
  auth: TarventCredentials;
  audienceId: unknown;
  groupId: unknown;
  contactId: unknown;
  add: boolean;
}) {
  const audience = tarventCommon.requireText({ value: audienceId, label: 'Audience' });
  const group = tarventCommon.requireText({ value: groupId, label: 'Audience group' });
  const id = tarventCommon.requireText({ value: contactId, label: 'Contact ID' });
  const mutation = add ? 'createGroupContact' : 'deleteGroupContact';
  await tarventTransport.field<{ id?: string }>({
    auth,
    query: `mutation ${add ? 'CreateGroupContact' : 'DeleteGroupContact'}($input: ${add ? 'CreateGroupContactInput' : 'DeleteGroupContactInput'}!) { ${mutation}(input: $input) { id } }`,
    variables: { input: { id, groupId: group, audienceId: audience } },
    name: mutation,
  });
  return { success: true, contactId: id, groupId: group, audienceId: audience, action: add ? 'ADD' : 'REMOVE' };
}

async function setContactJourney({ auth, contactId, journeyId, add }: { auth: TarventCredentials; contactId: unknown; journeyId: unknown; add: boolean }) {
  const id = tarventCommon.requireText({ value: contactId, label: 'Contact ID' });
  const journey = tarventCommon.requireText({ value: journeyId, label: 'Journey' });
  await tarventClient.booleanMutation({
    auth,
    operation: add ? 'EnterContactIntoJourney' : 'ExitContactFromJourney',
    field: add ? 'enterContactIntoJourney' : 'exitContactFromJourney',
    argDefs: '$id: String!, $journeyId: String!',
    args: 'id: $id, journeyId: $journeyId',
    variables: { id, journeyId: journey },
  });
  return { success: true, contactId: id, journeyId: journey, action: add ? 'ADD' : 'REMOVE' };
}

async function setJourneyStatus({ auth, journeyId, start }: { auth: TarventCredentials; journeyId: unknown; start: boolean }) {
  const id = tarventCommon.requireText({ value: journeyId, label: 'Journey' });
  await tarventClient.booleanMutation({
    auth,
    operation: start ? 'StartJourney' : 'StopJourney',
    field: start ? 'startJourney' : 'stopJourney',
    argDefs: '$id: String!',
    args: 'id: $id',
    variables: { id },
  });
  return { success: true, journeyId: id, action: start ? 'START' : 'STOP' };
}

async function deleteContact({ auth, audienceId, contactId }: { auth: TarventCredentials; audienceId: unknown; contactId: unknown }) {
  const audience = tarventCommon.requireText({ value: audienceId, label: 'Audience' });
  const id = tarventCommon.requireText({ value: contactId, label: 'Contact ID' });
  await tarventClient.booleanMutation({
    auth,
    operation: 'DeleteContact',
    field: 'deleteContact',
    argDefs: '$input: DeleteContactInput!',
    args: 'input: $input',
    variables: { input: { audienceId: audience, id } },
  });
  return { success: true, contactId: id, audienceId: audience };
}

async function recordCustomEvent({ auth, contactId, eventKey }: { auth: TarventCredentials; contactId: unknown; eventKey: unknown }) {
  const key = tarventCommon.requireText({ value: eventKey, label: 'Custom event' });
  const id = tarventCommon.requireText({ value: contactId, label: 'Contact ID' });
  await tarventClient.booleanMutation({
    auth,
    operation: 'CreateContactCustomEvent',
    field: 'createContactCustomEvent',
    argDefs: '$id: String!, $key: String!',
    args: 'id: $id, key: $key',
    variables: { id, key },
  });
  return { success: true, contactId: id, eventKey: key };
}

async function createAudienceGroup({
  auth,
  audienceId,
  name,
  description,
  isPublic,
}: {
  auth: TarventCredentials;
  audienceId: unknown;
  name: unknown;
  description: unknown;
  isPublic: boolean;
}) {
  const audience = tarventCommon.requireText({ value: audienceId, label: 'Audience' });
  const groupName = tarventCommon.requireText({ value: name, label: 'Group name' });
  const text = tarventCommon.trimmed(description);
  tarventCommon.checkLength({ value: groupName, label: 'Group name', max: 100 });
  tarventCommon.checkLength({ value: text, label: 'Group description', max: 255 });
  return tarventTransport.field<Record<string, unknown>>({
    auth,
    query: 'mutation CreateAudienceGroup($input: CreateGroupInput!) { createAudienceGroup(input: $input) { id name description isPublic isDynamic } }',
    variables: { input: { name: groupName, description: text ?? '', isDynamic: false, isPublic, audienceId: audience, criteria: null } },
    name: 'createAudienceGroup',
  });
}

async function findContact({
  auth,
  audienceId,
  email,
  contactId,
  legacyIdInEmail = false,
}: {
  auth: TarventCredentials;
  audienceId: unknown;
  email: unknown;
  contactId: unknown;
  legacyIdInEmail?: boolean;
}) {
  const audience = tarventCommon.requireText({ value: audienceId, label: 'Audience' });
  const rawEmail = tarventCommon.trimmed(email);
  const rawId = tarventCommon.trimmed(contactId);
  const emailIsLegacyId = legacyIdInEmail && rawId === undefined && rawEmail !== undefined && !rawEmail.includes('@');
  const byEmail = emailIsLegacyId ? undefined : rawEmail;
  const byId = emailIsLegacyId ? rawEmail : rawId;
  if ((byEmail === undefined) === (byId === undefined)) {
    throw new Error('Enter either Contact email or Contact ID (exactly one).');
  }
  const contact = await tarventClient.getContact({ auth, audienceId: audience, email: byEmail, contactId: byId });
  return { found: contact !== null, contact };
}

async function listContacts({ auth, audienceId, groupId, limit, cursor }: { auth: TarventCredentials; audienceId: unknown; groupId: unknown; limit: unknown; cursor: unknown }) {
  const audience = tarventCommon.requireText({ value: audienceId, label: 'Audience' });
  const group = tarventCommon.trimmed(groupId);
  return tarventClient.listPage({
    auth,
    operation: 'ListContacts',
    field: 'contacts',
    selection: tarventClient.fields.contact,
    argDefs: ', $input: GetAllContactsInput!',
    args: ', input: $input',
    variables: { input: { audienceId: audience, ...(group ? { groupId: group } : {}) } },
    first: tarventCommon.pageLimit(limit),
    after: tarventCommon.trimmed(cursor),
  });
}

async function findAudienceGroups({ auth, audienceId, name, limit, cursor }: { auth: TarventCredentials; audienceId: unknown; name: unknown; limit: unknown; cursor: unknown }) {
  const audience = tarventCommon.requireText({ value: audienceId, label: 'Audience' });
  const text = tarventCommon.trimmed(name);
  return tarventClient.listPage({
    auth,
    operation: 'FindAudienceGroups',
    field: 'audienceGroups',
    selection: 'id name description isPublic',
    argDefs: ', $audienceId: String!, $order: [AudienceGroupInfoSortInput!], $where: AudienceGroupInfoFilterInput',
    args: ', audienceId: $audienceId, order: $order, where: $where',
    variables: {
      audienceId: audience,
      order: [{ name: 'ASC' }],
      where: { and: [{ isDynamic: { eq: false } }, ...(text ? [{ name: { contains: text } }] : [])] },
    },
    first: tarventCommon.pageLimit(limit),
    after: tarventCommon.trimmed(cursor),
    withTotalCount: true,
  });
}

export const tarventOperations = {
  setContactTags,
  setGroupMembership,
  setContactJourney,
  setJourneyStatus,
  deleteContact,
  recordCustomEvent,
  createAudienceGroup,
  findContact,
  listContacts,
  findAudienceGroups,
};
