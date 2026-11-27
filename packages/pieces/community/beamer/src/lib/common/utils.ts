function toBoolean({ value, propName }: { value: string | undefined; propName: string }): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (value !== 'true' && value !== 'false') {
    throw new Error(`${propName} must be "true" or "false".`);
  }
  return value === 'true';
}

function checkCategory({ category }: { category: string | undefined }): void {
  if (category !== undefined && !CATEGORIES.includes(category)) {
    throw new Error(`category must be one of: ${CATEGORIES.join(', ')}.`);
  }
}

function checkReaction({ reaction }: { reaction: string | undefined }): void {
  if (reaction !== undefined && !REACTIONS.includes(reaction)) {
    throw new Error(`reaction must be one of: ${REACTIONS.join(', ')}.`);
  }
}

function pageSize({ limit }: { limit: number | undefined }): string {
  return String(Math.min(Math.max(Math.trunc(limit ?? MAX_PAGE_SIZE), 1), MAX_PAGE_SIZE));
}

export const beamerUtils = { toBoolean, checkCategory, checkReaction, pageSize };

const MAX_PAGE_SIZE = 10;
const CATEGORIES = ['new', 'improvement', 'fix', 'coming_soon', 'announcement'];
const REACTIONS = ['positive', 'neutral', 'negative'];
