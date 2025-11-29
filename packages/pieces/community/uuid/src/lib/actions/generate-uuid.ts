import { createAction, Property } from "@activepieces/pieces-framework";
import { v4 as uuidv4 } from "uuid";

export const generateUuidAction = createAction({
  name: 'generate_uuid',
  displayName: 'Generate UUID',
  description: 'Creates a random UUID v4',
  props: {},
  async run() {
    const id = uuidv4();
    return {
      uuid: id
    };
  },
});

