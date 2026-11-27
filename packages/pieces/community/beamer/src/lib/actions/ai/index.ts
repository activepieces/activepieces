import { getFeedUrlAction } from './feed/get-feed-url';
import { countPostCommentsAction } from './posts/count-post-comments';
import { countPostReactionsAction } from './posts/count-post-reactions';
import { countPostsAction } from './posts/count-posts';
import { countUnreadPostsAction } from './posts/count-unread-posts';
import { createPostAiAction } from './posts/create-post';
import { deletePostAction } from './posts/delete-post';
import { getPostAction } from './posts/get-post';
import { listPostCommentsAction } from './posts/list-post-comments';
import { listPostReactionsAction } from './posts/list-post-reactions';
import { listPostsAction } from './posts/list-posts';
import { listUnreadPostsAction } from './posts/list-unread-posts';
import { updatePostAction } from './posts/update-post';

export const beamerAiActions = [
  getFeedUrlAction,
  listPostsAction,
  createPostAiAction,
  countPostsAction,
  getPostAction,
  updatePostAction,
  deletePostAction,
  listPostCommentsAction,
  countPostCommentsAction,
  listPostReactionsAction,
  countPostReactionsAction,
  listUnreadPostsAction,
  countUnreadPostsAction,
];
