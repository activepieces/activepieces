import { createAction, Property, ApFile } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { cursorAuth } from '../common/auth';
import { makeCursorRequest } from '../common/client';
import { agentDropdown } from '../common/props';

interface ImageItem {
  image: ApFile;
  width: number;
  height: number;
}

export const addFollowupInstruction = createAction({
  auth: cursorAuth,
  name: 'add_followup_instruction',
  displayName: 'Add Followup Instruction to Agent',
  description: 'Adds follow-up instructions to a running cloud agent',
  props: {
    agentId: agentDropdown,
    text: Property.LongText({
      displayName: 'Instruction Text',
      description: 'The follow-up instruction text for the agent',
      required: true,
    }),
    images: Property.Array({
      displayName: 'Images',
      description: 'Optional images to include with the instruction (max 5)',
      required: false,
      properties: {
        image: Property.File({
          displayName: 'Image',
          description: 'Image file',
          required: true,
        }),
        width: Property.Number({
          displayName: 'Width',
          description: 'Image width in pixels',
          required: true,
        }),
        height: Property.Number({
          displayName: 'Height',
          description: 'Image height in pixels',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { agentId, text, images } = context.propsValue;

    const imageItems = (images as ImageItem[]) ?? [];

    if (imageItems.length > 5) {
      throw new Error('Maximum 5 images allowed');
    }

    const prompt: any = {
      text,
    };

    if (imageItems.length > 0) {
      prompt.images = imageItems.map((item) => ({
        data: item.image.base64,
        dimension: {
          width: item.width,
          height: item.height,
        },
      }));
    }

    return await makeCursorRequest(
      context.auth,
      `/v0/agents/${agentId}/followup`,
      HttpMethod.POST,
      { prompt }
    );
  },
});

