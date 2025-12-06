import { createAction, Property } from "@activepieces/pieces-framework";

export const addToBitdefenderExceptions = createAction({
  name: 'add-to-bitdefender-exceptions',
  displayName: 'Add to Bitdefender Exceptions',
  description: 'Adds a path or application to Bitdefender Antivirus exceptions',
  props: {
    path: Property.ShortText({
      displayName: 'Path to exclude',
      description: 'Folder or file to add to Bitdefender exclusions',
      required: true,
    }),
  },
  async run(context) {
    const { path } = context.propsValue;

    // Here you will later add real Bitdefender integration
    return {
      success: true,
      excluded: path,
    };
  },
});
