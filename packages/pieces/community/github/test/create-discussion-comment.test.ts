import { afterEach, describe, expect, test, vi } from 'vitest';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { githubDiscussionComments } from '../src/lib/actions/create-discussion-comment';
import { githubApiCall } from '../src/lib/common';
import { GithubAuthValue } from '../src/lib/common/auth-helpers';

vi.mock('../src/lib/common', async (importOriginal) => {
  const original = await importOriginal<typeof import('../src/lib/common')>();
  return { ...original, githubApiCall: vi.fn() };
});

const apiCall = vi.mocked(githubApiCall);

const auth: GithubAuthValue = {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: 'ghp_test',
};

function graphqlResponse(body: unknown) {
  return { status: 200, headers: {}, body };
}

function requestBody(callIndex: number) {
  return apiCall.mock.calls[callIndex][0].body;
}

describe('githubDiscussionComments.post', () => {
  afterEach(() => {
    apiCall.mockReset();
  });

  test('looks the discussion up by number, then comments on its node ID', async () => {
    apiCall
      .mockResolvedValueOnce(
        graphqlResponse({
          data: { repository: { discussion: { id: 'D_kwDOAbc123' } } },
        })
      )
      .mockResolvedValueOnce(
        graphqlResponse({
          data: {
            addDiscussionComment: {
              comment: {
                id: 'DC_kwDO1',
                body: 'Thanks!',
                createdAt: '2026-10-11T10:00:00Z',
                url: 'https://github.com/octo/repo/discussions/7#discussioncomment-1',
              },
            },
          },
        })
      );

    const response = await githubDiscussionComments.post({
      auth,
      owner: 'octo',
      repo: 'repo',
      discussionNumber: 7,
      body: 'Thanks!',
    });

    expect(apiCall).toHaveBeenCalledTimes(2);
    expect(requestBody(0).variables).toEqual({
      owner: 'octo',
      name: 'repo',
      number: 7,
    });
    expect(requestBody(1).variables).toEqual({
      discussionId: 'D_kwDOAbc123',
      body: 'Thanks!',
    });
    expect(response.body.data?.addDiscussionComment?.comment.id).toBe(
      'DC_kwDO1'
    );
  });

  test('sends quotes, backslashes and newlines as a variable, never inside the query', async () => {
    const body = 'He said "ship it"\\n\nThen: `done`';
    apiCall
      .mockResolvedValueOnce(
        graphqlResponse({
          data: { repository: { discussion: { id: 'D_1' } } },
        })
      )
      .mockResolvedValueOnce(
        graphqlResponse({
          data: {
            addDiscussionComment: {
              comment: { id: 'DC_1', body, createdAt: '', url: '' },
            },
          },
        })
      );

    await githubDiscussionComments.post({
      auth,
      owner: 'octo',
      repo: 'repo',
      discussionNumber: 1,
      body,
    });

    expect(requestBody(1).variables.body).toBe(body);
    expect(requestBody(1).query).not.toContain('ship it');
  });

  test('fails with a clear message when the discussion does not exist', async () => {
    apiCall.mockResolvedValueOnce(
      graphqlResponse({
        data: { repository: { discussion: null } },
        errors: [
          {
            type: 'NOT_FOUND',
            message: 'Could not resolve to a Discussion with the number of 99.',
          },
        ],
      })
    );

    await expect(
      githubDiscussionComments.post({
        auth,
        owner: 'octo',
        repo: 'repo',
        discussionNumber: 99,
        body: 'Hi',
      })
    ).rejects.toThrow('Discussion #99 was not found in octo/repo.');
    expect(apiCall).toHaveBeenCalledTimes(1);
  });

  test('fails with the GitHub message when the lookup returns another GraphQL error', async () => {
    apiCall.mockResolvedValueOnce(
      graphqlResponse({
        data: null,
        errors: [
          {
            type: 'FORBIDDEN',
            message: 'Resource not accessible by integration',
          },
        ],
      })
    );

    await expect(
      githubDiscussionComments.post({
        auth,
        owner: 'octo',
        repo: 'repo',
        discussionNumber: 3,
        body: 'Hi',
      })
    ).rejects.toThrow('Resource not accessible by integration');
  });

  test('fails when the comment mutation returns errors with HTTP 200', async () => {
    apiCall
      .mockResolvedValueOnce(
        graphqlResponse({
          data: { repository: { discussion: { id: 'D_2' } } },
        })
      )
      .mockResolvedValueOnce(
        graphqlResponse({
          data: { addDiscussionComment: null },
          errors: [{ message: 'Discussion is locked' }],
        })
      );

    await expect(
      githubDiscussionComments.post({
        auth,
        owner: 'octo',
        repo: 'repo',
        discussionNumber: 2,
        body: 'Hi',
      })
    ).rejects.toThrow('Discussion is locked');
  });
});
