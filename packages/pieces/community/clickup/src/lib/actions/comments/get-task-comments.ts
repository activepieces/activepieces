import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';
import { getTaskCommentsOutputSchema } from '../../output-schemas';

export const getClickupTaskComments = createAction({
  auth: clickupAuth,
  name: 'get_task_comments',
  classification: 'SEARCH',
  description: 'Get every comment on a ClickUp task.',
  audience: 'human',
  aiMetadata: { description: 'Read-only: retrieve the existing comments on a ClickUp task by its task ID. Use to review discussion or activity on a known task; does not create or modify anything. Safe to call repeatedly.', idempotent: true },
  displayName: 'Get Task Comments',
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: "The code at the end of the task's URL in ClickUp.",
      placeholder: 'e.g. 86b0x1abc',
      required: true,
    }),
  },
  outputSchema: getTaskCommentsOutputSchema,
  async run(configValue) {
    const { task_id } = configValue.propsValue;
    const accessToken = getAccessTokenOrThrow(configValue.auth);

    const firstPage = await fetchCommentsPage({
      taskId: task_id,
      accessToken,
      cursor: undefined,
    });
    const firstComments = firstPage.comments ?? [];
    const commentsById = new Map(
      firstComments.map((comment) => [comment.id, comment])
    );

    let currentPage = firstComments;
    let pagesFetched = 1;
    while (
      currentPage.length >= COMMENTS_PER_PAGE &&
      pagesFetched < MAX_PAGES
    ) {
      const lastOnPage = currentPage[currentPage.length - 1];
      const nextPage = await fetchCommentsPage({
        taskId: task_id,
        accessToken,
        cursor: { start: String(lastOnPage.date), start_id: lastOnPage.id },
      });
      pagesFetched += 1;
      currentPage = nextPage.comments ?? [];
      const unseen = currentPage.filter(
        (comment) => !commentsById.has(comment.id)
      );
      if (unseen.length === 0) {
        break;
      }
      unseen.forEach((comment) => commentsById.set(comment.id, comment));
    }

    return { ...firstPage, comments: [...commentsById.values()] };
  },
});

async function fetchCommentsPage({
  taskId,
  accessToken,
  cursor,
}: {
  taskId: string;
  accessToken: string;
  cursor: Record<string, string> | undefined;
}): Promise<ClickUpCommentsPage> {
  const response = await callClickUpApi<ClickUpCommentsPage>(
    HttpMethod.GET,
    `task/${taskId}/comment`,
    accessToken,
    {},
    cursor
  );
  return response.body;
}

const COMMENTS_PER_PAGE = 25;
const MAX_PAGES = 40;

type ClickUpComment = {
  id: string;
  date: string | number;
  [key: string]: unknown;
};

type ClickUpCommentsPage = {
  comments?: ClickUpComment[];
  [key: string]: unknown;
};
