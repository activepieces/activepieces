import { createAction, Property } from '@activepieces/pieces-framework';
import { Brand } from '../../common/Brand';
import { Replace } from '../../common/types';
import { vtexAuth } from '../../..';

export const createBrand = createAction({
  auth: vtexAuth,
  name: 'create-brand',
  displayName: 'Create new Brand',
  description: 'Create a new Brand to your catalog',
  props: {
    Name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    SiteTitle: Property.ShortText({
      displayName: 'Site Title',
      required: false,
    }),
    LinkId: Property.ShortText({
      displayName: 'Link ID',
      required: false,
    }),
    Id: Property.Number({
      displayName: 'Brand ID',
      description: 'Set the brand ID',
      required: false,
    }),
    Text: Property.ShortText({
      displayName: 'Text',
      required: false,
    }),
    MenuHome: Property.Checkbox({
      displayName: 'Menu Home',
      required: false,
    }),
    Keywords: Property.ShortText({
      displayName: 'Keywords',
      description: 'Similar words',
      required: false,
    }),
    Active: Property.Checkbox({
      displayName: 'Active',
      required: false,
    }),
    Score: Property.Number({
      displayName: 'Score',
      required: false,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth;
    const brandData: Replace<
      typeof context.propsValue,
      { authentication?: typeof context.auth }
    > = { ...context.propsValue };
    delete brandData.authentication;

    const brand = new Brand(hostUrl, appKey, appToken);

    return await brand.createBrand({
      Id: context.propsValue.Id,
      Name: context.propsValue.Name,
      Text: context.propsValue.Text,
      Keywords: context.propsValue.Keywords,
      SiteTitle: context.propsValue.SiteTitle,
      Active: context.propsValue.Active,
      MenuHome: context.propsValue.MenuHome,
      Score: context.propsValue.Score,
      LinkId: context.propsValue.LinkId,
    });
  },
});
