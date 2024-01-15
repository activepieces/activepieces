import { createAction, Property } from '@activepieces/pieces-framework';
import { vtexAuth } from '../../..';
import { SkuFile } from '../../common/SKU-File';
import { Replace } from '../../common/types';

export const createSkuFile = createAction({
  auth: vtexAuth,
  name: 'create-sku-file',
  displayName: 'Create New Sku File',
  description: 'Create a new SKU File to your catalog',
  props: {
    SkuId: Property.Number({
      displayName: 'Sku ID',
      description: 'Set the Sku ID',
      required: true,
    }),
    Url: Property.ShortText({
      displayName: 'Image Url',
      required: true,
    }),
    Name: Property.ShortText({
      displayName: 'Image Name',
      required: true,
    }),
    IsMain: Property.Checkbox({
      displayName: 'Is Main Image',
      required: true,
    }),
    Label: Property.ShortText({
      displayName: 'Image Label',
      required: false,
    }),
    Text: Property.ShortText({
      displayName: 'Image Name',
      description: 'General text of the image',
      required: false,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth;
    const skuFile = new SkuFile(hostUrl, appKey, appToken);

    return await skuFile.createSkuFile(context.propsValue.SkuId, {
      Url: context.propsValue.Url,
      Name: context.propsValue.Name,
      IsMain: context.propsValue.IsMain,
      Label: context.propsValue.Label,
      Text: context.propsValue.Text,
    });
  },
});
