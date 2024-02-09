import { createAction, Property } from '@activepieces/pieces-framework';
import { Product } from '../../common/Product';
import { Replace } from '../../common/types';
import { vtexAuth } from '../../..';

export const updateProduct = createAction({
  auth: vtexAuth,
  name: 'Update-product',
  displayName: 'Update a Product',
  description: 'Update a product in your catalog',
  props: {
    productId: Property.Number({
      displayName: 'Product ID',
      description: 'Set the product ID',
      required: true,
    }),
    Name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    Title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    Description: Property.ShortText({
      displayName: 'Description',
      required: true,
    }),
    BrandId: Property.Number({
      displayName: 'Brand ID',
      required: true,
    }),
    CategoryId: Property.Number({
      displayName: 'Category ID',
      required: true,
    }),
    DepartmentId: Property.Number({
      displayName: 'DepartmentId',
      required: true,
    }),
    LinkId: Property.ShortText({
      displayName: 'Link ID',
      required: false,
    }),
    RefId: Property.ShortText({
      displayName: 'Ref ID',
      required: false,
    }),
    BrandName: Property.ShortText({
      displayName: 'Brand Name',
      required: false,
    }),
    IsVisible: Property.Checkbox({
      displayName: 'Is Visible',
      required: false,
    }),
    DescriptionShort: Property.ShortText({
      displayName: 'Short Description',
      required: false,
    }),
    ReleaseDate: Property.ShortText({
      displayName: 'Release Date',
      required: false,
    }),
    KeyWords: Property.ShortText({
      displayName: 'Key Words',
      description: 'Similar words',
      required: false,
    }),
    IsActive: Property.Checkbox({
      displayName: 'Is Active',
      required: false,
    }),
    TaxCode: Property.ShortText({
      displayName: 'Tax Code',
      required: false,
    }),
    MetaTagDescription: Property.ShortText({
      displayName: 'Metatag description',
      required: false,
    }),
    ShowWithoutStock: Property.Checkbox({
      displayName: 'Show Without Stock',
      required: false,
    }),
    Score: Property.Number({
      displayName: 'Score',
      required: false,
    }),
  },
  async run(context) {
    const { hostUrl, appKey, appToken } = context.auth;
    const { productId, ...restProps } = context.propsValue;

    const updatedProduct = {
      productId,
      Name: restProps.Name,
      Title: restProps.Title,
      Description: restProps.Description,
      BrandId: restProps.BrandId,
      CategoryId: restProps.CategoryId,
      DepartmentId: restProps.DepartmentId,
      LinkId: restProps.LinkId,
      RefId: restProps.RefId,
      BrandName: restProps.BrandName,
      IsVisible: restProps.IsVisible,
      DescriptionShort: restProps.DescriptionShort,
      ReleaseDate: restProps.ReleaseDate,
      KeyWords: restProps.KeyWords,
      IsActive: restProps.IsActive,
      TaxCode: restProps.TaxCode,
      MetaTagDescription: restProps.MetaTagDescription,
      ShowWithoutStock: restProps.ShowWithoutStock,
      Score: restProps.Score,
    };

    const product = new Product(hostUrl, appKey, appToken);

    return await product.updateProduct(productId, updatedProduct);
  },
});
