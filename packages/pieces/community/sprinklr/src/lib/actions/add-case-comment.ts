import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { sprinklrAuth } from '../auth';
import { sprinklrCaseWrite } from '../common/case-write';
import { sprinklrClient } from '../common/client';
import { sprinklrEndpoints } from '../common/endpoints';
import { sprinklrErrors } from '../common/errors';

const ENTITY_TYPE = 'CASE';

const outputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Comment ID' },
    { key: 'text', label: 'Text' },
    { key: 'commentingUser', label: 'Commenting User ID' },
    { key: 'createdTime', label: 'Created Time', description: 'Epoch milliseconds' },
    { key: 'entityType', label: 'Entity Type' },
    { key: 'entityId', label: 'Case Number' },
  ],
};

function text(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function epoch(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0 && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function normalizeComment({ data, sent }: { data: unknown; sent: { text: string; entityId: string } }): SprinklrCommentOutput {
  const first = Array.isArray(data) ? data[0] : data;
  const comment = sprinklrErrors.isRecord(first) ? first : {};
  return {
    id: text(comment['id']),
    text: text(comment['text']) ?? sent.text,
    commentingUser: text(comment['commentingUser']),
    createdTime: epoch(comment['createdTime']),
    entityType: text(comment['entityType']) ?? ENTITY_TYPE,
    entityId: text(comment['entityId']) ?? sent.entityId,
  };
}

export const addCaseCommentAction = createAction({
  auth: sprinklrAuth,
  name: 'add_case_comment',
  classification: 'WRITE',
  displayName: 'Add Comment to Case',
  description: 'Adds a comment to a case.',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a text comment to an existing Sprinklr case, addressed by its case number (not the case ID). Use it to record notes or context on a case; to change case fields use Update Case instead. Each call adds another comment, so a retry posts a duplicate.',
    idempotent: false,
  },
  outputSchema,
  props: {
    case_number: sprinklrCaseWrite.caseNumberProp(),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'The text of the comment.',
      required: true,
    }),
    is_private: Property.Checkbox({
      displayName: 'Private',
      description: 'Keep the comment out of connected third-party tools.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  async run(context) {
    const entityId = sprinklrCaseWrite.parseCaseNumber(context.propsValue.case_number);
    const commentText = context.propsValue.comment;
    if (typeof commentText !== 'string' || commentText.trim().length === 0) {
      throw new Error('Comment is empty. Enter the text of the comment.');
    }
    const data = await sprinklrClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: sprinklrEndpoints.COMMENT,
      body: {
        entityType: ENTITY_TYPE,
        entityId,
        text: commentText,
        isPrivate: context.propsValue.is_private === true,
      },
      retryOn5xx: false,
    });
    return normalizeComment({ data, sent: { text: commentText, entityId } });
  },
});

export type SprinklrCommentOutput = {
  id: string | null;
  text: string | null;
  commentingUser: string | null;
  createdTime: number | null;
  entityType: string | null;
  entityId: string | null;
};
