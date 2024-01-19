import { createAction, Property } from '@activepieces/pieces-framework';
import { Brand } from '../../common/Brand';
import { Replace } from '../../common/types';
import { vtexAuth } from '../../..';

export const updateBrand = createAction({
  auth: vtexAuth,
  name: 'update-brand',
  displayName: 'Update Brand',
  description: 'Update a Brand in your catalog',
  props: {
    Id: Property.Number({
      displayName: 'Brand ID',
      description: 'Set the brand ID',
      required: true,
    }),
    Name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    SiteTitle: Property.ShortText({
      displayName: 'Site Title',
      required: true,
    }),
    LinkId: Property.ShortText({
      displayName: 'Link ID',
      required: true,
    }),
    Text: Property.ShortText({
      displayName: 'Text',
      required: true,
    }),
    MenuHome: Property.Checkbox({
      displayName: 'Menu Home',
      required: true,
    }),
    Keywords: Property.ShortText({
      displayName: 'Keywords',
      description: 'Similar words',
      required: true,
    }),
    Active: Property.Checkbox({
      displayName: 'Active',
      required: true,
    }),
    Score: Property.Number({
      displayName: 'Score',
      required: true,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth;
    const {
      Id,
      Name,
      SiteTitle,
      LinkId,
      Text,
      MenuHome,
      Keywords,
      Active,
      Score,
    } = context.propsValue;

    const brandData = {
      Id,
      Name,
      SiteTitle,
      LinkId,
      Text,
      MenuHome,
      Keywords,
      Active,
      Score,
    };

    const brand = new Brand(hostUrl, appKey, appToken);

    return await brand.updateBrand(Id, brandData);
  },
});
