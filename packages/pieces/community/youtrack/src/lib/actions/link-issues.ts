import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown, resolveIssue } from '../common';
import { youtrackClient } from '../common/client';
import { linkIssuesActionOutputSchema } from '../output-schemas';

function phrasesForDirection({ type, direction }: { type: Record<string, unknown>; direction: unknown }): unknown[] {
  if (direction === 'OUTWARD') return [type['sourceToTarget']];
  if (direction === 'INWARD') return [type['targetToSource']];
  return [type['sourceToTarget'], type['targetToSource'], type['name']];
}

function hasLink({ links, linkType, targetId }: { links: Record<string, unknown>[]; linkType: string; targetId: string }): boolean {
  const wantedType = linkType.toLowerCase();
  return links.some((link) => {
    const type = youtrackClient.recordOf(link['linkType']);
    const phrases = phrasesForDirection({ type, direction: link['direction'] })
      .filter((p): p is string => typeof p === 'string')
      .map((p) => p.toLowerCase());
    if (!phrases.includes(wantedType)) return false;
    return youtrackClient.records(link['issues']).some((issue) => issue['id'] === targetId);
  });
}

export const linkIssuesAction = createAction({
  auth: youtrackAuth,
  name: 'link_issues',
  classification: 'WRITE',
  outputSchema: linkIssuesActionOutputSchema,
  displayName: 'Link Issues',
  description: 'Creates a relationship between two issues (e.g. "relates to", "depends on", "is duplicated by").',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a directional relationship from a source issue (ID like "2-38" or "APT-5") to one or more target issues (readable IDs like "NP-92", several separated by spaces) with a link type phrase (relates to, depends on, duplicates, is duplicated by, parent for, subtask of, or another phrase from List Link Types). Each target is looked up first, one command clause is sent per target, and the links are read back afterwards; the step fails if YouTrack did not create them. Idempotent: re-creating an existing link of the same type leaves the relationship unchanged.',
    idempotent: true,
  },
  props: {
    sourceIssue: issueDropdown,
    targetIssueId: Property.ShortText({
      displayName: 'Target Issue ID',
      description: 'The readable ID of the issue to link to (e.g. "NP-92"), or several IDs separated by spaces. You can find this in the issue URL or header.',
      required: true,
    }),
    linkType: Property.StaticDropdown({
      displayName: 'Link Type',
      description: 'The type of relationship between the issues.',
      required: true,
      defaultValue: 'relates to',
      options: {
        options: [
          { label: 'Relates to', value: 'relates to' },
          { label: 'Depends on', value: 'depends on' },
          { label: 'Is duplicated by', value: 'is duplicated by' },
          { label: 'Duplicates', value: 'duplicates' },
          { label: 'Parent for', value: 'parent for' },
          { label: 'Subtask of', value: 'subtask of' },
        ],
      },
    }),
  },
  async run(context) {
    const sourceValue = youtrackClient.optionalText(context.propsValue.sourceIssue) ?? '';
    const sourceId = youtrackClient.isDatabaseId(sourceValue)
      ? sourceValue
      : (await resolveIssue({ auth: context.auth, value: context.propsValue.sourceIssue })).id;
    const target = youtrackClient.optionalText(context.propsValue.targetIssueId);
    const linkType = youtrackClient.optionalText(context.propsValue.linkType);
    if (target === undefined || linkType === undefined) {
      throw new Error('Target Issue ID and Link Type are required.');
    }
    const tokens = target.split(/[\s,]+/).filter((token) => token !== '');
    if (tokens.length === 0) {
      throw new Error('Target Issue ID is required.');
    }
    const targets: Array<Awaited<ReturnType<typeof resolveIssue>>> = [];
    for (const token of tokens) {
      targets.push(await resolveIssue({ auth: context.auth, value: token }));
    }
    const command = tokens.map((token) => linkType + ' ' + token).join(' ');
    await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/commands',
      body: { query: command, issues: [{ id: sourceId }] },
      operation: 'link the issues',
    });
    const links = await youtrackClient.listAll({
      auth: context.auth,
      path: `/issues/${youtrackClient.segment({ value: sourceId, label: 'Issue' })}/links`,
      query: { fields: 'id,direction,linkType(name,sourceToTarget,targetToSource),issues(id,idReadable)' },
      maxItems: 1000,
      operation: 'read back the issue links',
    });
    const missing = targets.filter((t) => !hasLink({ links, linkType, targetId: t.id }));
    if (missing.length > 0) {
      throw new Error(`YouTrack accepted the command "${command}" but the link to ${missing.map((t) => t.idReadable ?? t.id).join(', ')} is not on the issue. Check the Target Issue ID and that the link type exists (see List Link Types).`);
    }
    return { success: true, link_type: context.propsValue.linkType, target_issue: context.propsValue.targetIssueId };
  },
});
