import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
} from '@activepieces/pieces-common';
import { trelloCommon } from '../../common';
import { TrelloCard } from '../../common/props/card';
import { trelloAuth } from '../../..';
import { updateCardActionOutputSchema } from '../../output-schemas';

export const updateCard = createAction({
  auth: trelloAuth,
  name: 'update_card',
  classification: 'WRITE',
  displayName: 'Update Card',
  description: 'Updates an existing card.',
  audience: 'human',
  outputSchema: updateCardActionOutputSchema,
  aiMetadata: { description: 'Updates fields on an existing Trello card identified by card_id, including name, description, due date, labels, position, and archived (closed) state, and can move it to a different list. Use to edit, archive, or relocate a card. Requires card_id; only provided fields change. Repeating with the same inputs converges to the same card state.', idempotent: true },
  propertyGroups: [
    { key: 'card', display: 'section', label: 'Card to Update', icon: 'tag', props: ['card_id', 'board_id'] },
    { key: 'changes', display: 'section', label: 'Changes', icon: 'sliders', props: ['changes_info', 'name', 'description', 'due', 'closed', 'position', 'labels', 'list_id'] },
  ],
  props: {
    card_id: Property.ShortText({
      description: "From an earlier step, or the code after /c/ in the card's URL.",
      displayName: 'Card ID',
      placeholder: 'aBcD1234',
      required: true,
    }),
    board_id: trelloCommon.board_id_opt,
    changes_info: Property.MarkDown({
      value: 'Fields left empty keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    name: Property.ShortText({
      displayName: 'Card Name',
      required: false,
    }),
    description: Property.LongText({
      description: 'Markdown formatting is supported.',
      displayName: 'Card Description',
      required: false,
    }),
    due: Property.DateTime({
      displayName: 'Due Date',
      placeholder: '2026-12-31',
      required: false,
      width: 'half',
    }),
    closed: Property.Checkbox({
      description: 'On archives the card. Off keeps it open or restores it.',
      displayName: 'Archived',
      required: false,
      width: 'half',
    }),
    position: Property.StaticDropdown({
      description: 'Empty keeps the card where it is in its list.',
      displayName: 'Position',
      required: false,
      options: {
        options: [
          { label: 'Top', value: 'top' },
          { label: 'Bottom', value: 'bottom' },
        ],
      },
    }),
    labels: trelloCommon.board_labels_replace,
    list_id: trelloCommon.move_to_list,
  },

  async run(context) {
    const body: any = {};
    
    if (context.propsValue['name']) {
      body.name = context.propsValue['name'];
    }
    
    if (context.propsValue['description']) {
      body.desc = context.propsValue['description'];
    }
    
    if (context.propsValue['list_id']) {
      body.idList = context.propsValue['list_id'];
    }
    
    if (context.propsValue['position']) {
      body.pos = context.propsValue['position'];
    }
    
    const labels = context.propsValue['labels'];
    if (Array.isArray(labels) && labels.length > 0) {
      body.idLabels = labels;
    }
    
    if (context.propsValue['closed'] !== undefined) {
      body.closed = context.propsValue['closed'];
    }
    
    if (context.propsValue['due']) {
      body.due = context.propsValue['due'];
    }

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url:
        `${trelloCommon.baseUrl}cards/${context.propsValue['card_id']}` +
        `?key=` +
        context.auth.username +
        `&token=` +
        context.auth.password,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body,
      queryParams: {},
    };
    
    const response = await httpClient.sendRequest<TrelloCard>(request);

    return response.body;
  },
});
