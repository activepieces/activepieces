import { Property } from '@activepieces/pieces-framework';

function fileId<R extends boolean>({
  required,
  displayName = 'File ID',
  description = 'Box file ID, e.g. "12345". Get it from List Folder Items, Search or Upload File.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function folderId<R extends boolean>({
  required,
  displayName = 'Folder ID',
  description = 'Box folder ID. "0" is the root "All Files" folder. Get others from List Folder Items, Search or Create Folder.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function fields<R extends boolean>({
  required,
  displayName = 'Fields',
  description = 'Comma-separated fields to return instead of the default set, e.g. "id,name,size,shared_link". Leave empty for the defaults.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function limit<R extends boolean>({
  required,
  displayName = 'Limit',
  description = 'Max items to return (1-1000). Defaults to 100.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function offset<R extends boolean>({
  required,
  displayName = 'Offset',
  description = 'Items to skip, for the next page: the previous offset plus its limit. Defaults to 0.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function marker<R extends boolean>({
  required,
  displayName = 'Marker',
  description = 'The next_marker from the previous page, to get the next page. Leave empty for the first page.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function collaborationId<R extends boolean>({
  required,
  displayName = 'Collaboration ID',
  description = 'Box collaboration ID. Get it from List File Collaborations, List Folder Collaborations or Create Collaboration.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function collectionId<R extends boolean>({
  required,
  displayName = 'Collection ID',
  description = 'ID of the collection. Get it from List Collections.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function commentId<R extends boolean>({
  required,
  displayName = 'Comment ID',
  description = 'Box comment ID, e.g. "740059083". Get it from List File Comments or Create Comment.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function enterpriseId<R extends boolean>({
  required,
  displayName = 'Enterprise ID',
  description = 'Box enterprise ID. Get it from Get Current User with Fields "enterprise".',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function etag<R extends boolean>({
  required,
  displayName = 'ETag',
  description = "The file's last seen etag (from Get File). The delete fails with 412 if the file changed since.",
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function fileVersionId<R extends boolean>({
  required,
  displayName = 'File Version ID',
  description = 'ID of the version. Get it from List File Versions.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function groupId<R extends boolean>({
  required,
  displayName = 'Group ID',
  description = 'Box group ID, e.g. "29348110806". Get it from List Groups or Create Group.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function groupMembershipId<R extends boolean>({
  required,
  displayName = 'Group Membership ID',
  description = 'ID of the membership. Get it from Add User To Group, List Group Memberships or List User Memberships.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function metadataCascadePolicyId<R extends boolean>({
  required,
  displayName = 'Metadata Cascade Policy ID',
  description = 'The policy ID from List Metadata Cascade Policies or Create Metadata Cascade Policy.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function metadataNamespace<R extends boolean>({
  required,
  displayName = 'Namespace',
  description = 'The enterprise namespace, "enterprise_<enterprise id>", e.g. "enterprise_123456".',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function metadataScope<R extends boolean>({
  required,
  displayName = 'Scope',
  description = '"global" or "enterprise" (or "enterprise_<id>").',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function metadataTemplateKey<R extends boolean>({
  required,
  displayName = 'Template Key',
  description = 'The templateKey from List Enterprise Metadata Templates.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function signRequestId<R extends boolean>({
  required,
  displayName = 'Sign Request ID',
  description = 'The sign request ID, from List Sign Requests or Create Sign Request.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function signTemplateId<R extends boolean>({
  required,
  displayName = 'Template ID',
  description = 'Sign template ID from List Sign Templates, to create the request from a template.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function slackChannelId<R extends boolean>({
  required,
  displayName = 'Slack Channel ID',
  description = 'The Slack channel ID, e.g. "C12378991223".',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function taskAssignmentId<R extends boolean>({
  required,
  displayName = 'Task Assignment ID',
  description = 'Box task assignment ID. Get it from List Task Assignments or Assign Task.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function taskId<R extends boolean>({
  required,
  displayName = 'Task ID',
  description = 'Box task ID, e.g. "44484654556". Get it from List File Tasks or Create Task.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function taxonomyKey<R extends boolean>({
  required,
  displayName = 'Taxonomy Key',
  description = "The taxonomy's key, from List Metadata Taxonomies or Create Metadata Taxonomy.",
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function taxonomyNodeId<R extends boolean>({
  required,
  displayName = 'Node ID',
  description = "The node's id, a UUID, from List Metadata Taxonomy Nodes or Create Metadata Taxonomy Node.",
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function userId<R extends boolean>({
  required,
  displayName = 'User ID',
  description = 'Box user ID, e.g. "53588552965". Get it from List Users or Get Current User.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function webLinkId<R extends boolean>({
  required,
  displayName = 'Web Link ID',
  description = 'Box web link ID, e.g. "49630791796". Get it from List Folder Items, Search or Create Web Link.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function zipDownloadId<R extends boolean>({
  required,
  displayName = 'Zip Download ID',
  description = 'The ID segment of the status_url (or download_url) from Create Zip Download: the part between "/zip_downloads/" and "/status".',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function booleanFlag<R extends boolean>({ required, displayName, description }: Required<PropParams<R>>) {
  return Property.StaticDropdown({ displayName, description, required, options: { options: booleanOptions } });
}

export const boxAiProps = {
  fileId,
  folderId,
  fields,
  limit,
  offset,
  marker,
  collaborationId,
  collectionId,
  commentId,
  enterpriseId,
  etag,
  fileVersionId,
  groupId,
  groupMembershipId,
  metadataCascadePolicyId,
  metadataNamespace,
  metadataScope,
  metadataTemplateKey,
  signRequestId,
  signTemplateId,
  slackChannelId,
  taskAssignmentId,
  taskId,
  taxonomyKey,
  taxonomyNodeId,
  userId,
  webLinkId,
  zipDownloadId,
  booleanFlag,
};

const booleanOptions = [
  { label: 'true', value: 'true' },
  { label: 'false', value: 'false' },
];

type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
