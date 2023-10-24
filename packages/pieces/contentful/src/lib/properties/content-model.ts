import { DropdownOption, Property } from '@activepieces/pieces-framework';
import _ from 'lodash';
import { ContentfulAuth, makeClient } from '../common';

const ContentModel = Property.Dropdown<string>({
  displayName: 'Content Model',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (_.isEmpty(auth)) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account',
      };
    }
    const { client } = makeClient(auth as ContentfulAuth);
    try {
      const models: DropdownOption<string>[] = [];
      let contentModels = await client.contentType.getMany({
        query: { limit: 1000 },
      });
      models.push(
        ...contentModels.items.map((model) => ({
          value: model.sys.id,
          label: model.name,
        }))
      );
      while (contentModels.skip + contentModels.limit < contentModels.total) {
        contentModels = await client.contentType.getMany({
          query: { skip: contentModels.skip + contentModels.limit },
        });
        models.push(
          ...contentModels.items.map((model) => ({
            value: model.sys.id,
            label: model.name,
          }))
        );
      }
      return {
        disabled: false,
        options: models.sort((a, b) =>
          a.label < b.label ? -1 : a.label > b.label ? 1 : 0
        ),
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

export default ContentModel;
