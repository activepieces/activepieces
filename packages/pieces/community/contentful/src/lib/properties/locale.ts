import { DropdownOption, Property } from '@activepieces/pieces-framework';
import { ContentfulAuth, makeClient } from '../common';
import { isEmpty } from '@activepieces/shared';

const Locale = Property.Dropdown({
  displayName: 'Content Locale',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (isEmpty(auth)) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account',
      };
    }
    const { client } = makeClient(auth as ContentfulAuth);
    try {
      const response = await client.locale.getMany({});
      const options: DropdownOption<string>[] = response.items.map(
        (locale) => ({ label: locale.name, value: locale.code })
      );
      return {
        disabled: false,
        options,
      };
    } catch (e) {
      console.debug(e);
      return {
        disabled: true,
        options: [],
        placeholder: 'Please check your Contentful connection settings',
      };
    }
  },
});

export default Locale;
