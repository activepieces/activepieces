import { hookTrigger } from './hook';

export const articleReady = hookTrigger({ name: 'article_ready', displayName: 'Article Ready', event: 'article.ready',
  description: 'Triggers when an article is ready for review or publishing (the AI finished writing it, or it moved to review / approved).', sample: { status: 'review', previousStatus: 'draft', publishedAt: null, wpUrl: null } });
export const articlePublished = hookTrigger({ name: 'article_published', displayName: 'Article Published', event: 'article.published',
  description: 'Triggers when an article is live on WordPress (with the post URL).' });
export const articleFailed = hookTrigger({ name: 'article_failed', displayName: 'Article Publishing Failed', event: 'article.failed',
  description: 'Triggers when publishing an article failed after all retries (with the last error).', sample: { status: 'failed', lastError: 'WordPress answered 401 – please check the connection.', publishedAt: null, wpUrl: null } });
