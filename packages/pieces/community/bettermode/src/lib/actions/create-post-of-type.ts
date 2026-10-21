import { BettermodeCredentials } from '../common/client';
import { bettermodeInput } from '../common/input';
import { bettermodeOps } from '../common/operations';

export async function createLegacyPost({
  auth,
  postTypeName,
  propsValue,
}: {
  auth: BettermodeCredentials;
  postTypeName: string;
  propsValue: { spaceId: unknown; title: unknown; content: unknown; tagNames?: unknown; locked?: unknown };
}) {
  const spaceId = bettermodeInput.requireText({ value: propsValue.spaceId, label: 'Space' });
  const title = bettermodeInput.requireText({ value: propsValue.title, label: 'Title' });
  const content = bettermodeInput.requireText({ value: propsValue.content, label: 'Content' });
  const tagNames = bettermodeOps.tagNames(propsValue.tagNames);
  const locked = bettermodeInput.optionalBoolean({ value: propsValue.locked, label: 'Locked' }) ?? false;
  const postType = await bettermodeOps.findPostTypeByName({ auth, name: postTypeName, spaceId });
  const post = await bettermodeOps.createPost({
    auth,
    spaceId,
    postTypeId: postType.id,
    title,
    content,
    tagNames,
    locked,
  });
  return { createdAt: post.created_at, ...post };
}
