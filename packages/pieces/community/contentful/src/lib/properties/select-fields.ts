import { DropdownState, Property } from '@activepieces/pieces-framework';
import { ContentfulAuth, PropertyKeys, makeClient } from '../common';
import { isEmpty, isNil } from '@activepieces/shared';

const SelectFields = Property.MultiSelectDropdown({
  displayName: 'Return Fields',
  description: 'The fields to return for each record.',
  refreshers: [PropertyKeys.CONTENT_MODEL],
  required: false,
  options: async ({ auth, [PropertyKeys.CONTENT_MODEL]: model }) => {
    const searchFields: DropdownState<string> = {
      options: [],
      disabled: true,
      placeholder: '',
    };

    if (isEmpty(auth) || isNil(model)) return searchFields;

    try {
      const { client } = makeClient(auth as ContentfulAuth);
      const contentType = await client.contentType.get({
        contentTypeId: model as unknown as string,
      });
      // Process available options
      searchFields.options = contentType.fields
      .filter((f) => !!f.id && !f.omitted && !f.disabled && !f.deleted)
      .map((f) => ({ label: f.name as string, value: `fields.${f.id}` }));
    
      searchFields.disabled = false;
      searchFields.placeholder = 'Select fields to return';
    } catch (e) {
      console.debug(e);
    }
    return searchFields;
  },
});

export default SelectFields;
