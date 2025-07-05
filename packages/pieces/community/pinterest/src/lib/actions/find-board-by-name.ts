import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const findBoardByName = createAction({
  auth: pinterestAuth,
  name: 'findBoardByName',
  displayName: 'Find Board by Name',
  description: 'Locate a board by its name for pinning or updates.',
  props: {
    name: Property.ShortText({
      displayName: 'Board Name',
      required: true,
      description: 'The name of the board to find.'
    })
  },
  async run({ auth, propsValue }) {
    const name = propsValue['name'];
    // Pinterest API: GET /boards returns all boards, filter by name
    let bookmark: string | undefined = undefined;
    let foundBoard = null;
    do {
      const params = bookmark ? `?bookmark=${encodeURIComponent(bookmark)}` : '';
      const response = await makeRequest(auth as string, HttpMethod.GET, `/boards${params}`);
      const boards = response.items || [];
      foundBoard = boards.find((b: any) => b.name && b.name.toLowerCase() === name.toLowerCase());
      bookmark = response.bookmark;
    } while (!foundBoard && bookmark);
    return foundBoard;
  },
});
