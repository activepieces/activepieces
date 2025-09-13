import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ForeplayAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { BoardIdDropdown } from '../common/dropdown';

export const findBoard = createAction({
  auth: ForeplayAuth,
  name: 'find_board',
  displayName: 'Find Board',
  description: 'Find a specific board associated with the authenticated user by ID.',
  props: {
    boardId: BoardIdDropdown,
  },
  async run({ auth, propsValue }) {
    const boardId = propsValue.boardId as string;
    if (!boardId) {
      throw new Error('Board ID is required');
    }

    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/boards`
    );

    const boards = Array.isArray(response) ? response : response?.data ?? [];

    const board = boards.find((b: any) => b.id === boardId);
    if (!board) {
      throw new Error(`Board with ID ${boardId} not found`);
    }

    return board;
  },
});
