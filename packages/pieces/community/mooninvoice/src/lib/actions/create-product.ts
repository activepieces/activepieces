import { createAction, Property } from '@activepieces/pieces-framework';
import { mooninvoiceAuth } from '../common/auth';
import { getAccessToken, makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { companyIdProp } from '../common/props';

export const createProduct = createAction({
  auth: mooninvoiceAuth,
  name: 'createProduct',
  displayName: 'Create Product',
  description: 'Create a new product in MoonInvoice',
  props: {
    companyId: companyIdProp,
    productName: Property.ShortText({
      displayName: 'Product Name',
      description: 'Name of product',
      required: true,
    }),
    productCode: Property.ShortText({
      displayName: 'Product Code',
      description: 'SKU code of product',
      required: false,
    }),
    productBuyCost: Property.Number({
      displayName: 'Product Buy Cost',
      description: 'Buy cost of product',
      required: false,
    }),
    productUnitCost: Property.Number({
      displayName: 'Product Unit Cost',
      description: 'Sell or Unit cost of product',
      required: false,
    }),
    productType: Property.ShortText({
      displayName: 'Product Type',
      description: 'Type of product like kg, piece, liter etc.',
      required: false,
    }),
    productQuantity: Property.Number({
      displayName: 'Product Quantity',
      description: 'Quantity of product',
      required: false,
    }),
    productNotes: Property.LongText({
      displayName: 'Product Notes',
      description: 'Note or Description about product',
      required: false,
    }),
    productCategory: Property.ShortText({
      displayName: 'Product Category',
      description: 'Category of product',
      required: false,
    }),
    productSelectedCurrency: Property.ShortText({
      displayName: 'Product Currency',
      description: 'Currency code like INR, USD, CAD etc.',
      required: false,
    }),
    hsnCode: Property.ShortText({
      displayName: 'HSN Code',
      description: 'HSNCode of product',
      required: false,
    }),
    productStockManage: Property.Checkbox({
      displayName: 'Stock Manage',
      description: 'Enable stock management for this product',
      required: false,
    }),
    showInMenu: Property.Checkbox({
      displayName: 'Show In Menu',
      description: 'Show product in POS menu',
      required: false,
    }),
    productSerialized: Property.Checkbox({
      displayName: 'Product Serialized',
      description: 'Enable serial number tracking for each unit',
      required: false,
    }),
    productBatched: Property.Checkbox({
      displayName: 'Product Batched',
      description: 'Enable batch management for this product',
      required: false,
    }),
    productDietType: Property.StaticDropdown({
      displayName: 'Product Diet Type',
      description: 'Dietary classification of the product',
      required: false,
      options: {
        options: [
          { label: 'Veg', value: '1' },
          { label: 'Non Veg', value: '2' },
          { label: 'None', value: '3' },
          { label: 'Egg', value: '4' },
        ],
      },
    }),
    productBuyTaxJson: Property.LongText({
      displayName: 'Product Buy Tax (JSON)',
      description:
        'Array of tax IDs applied on product buy. Example: ["95A1956E-E60A-4FAC-8EC4-C88EE7431280"]',
      required: false,
    }),
    productSalesTaxJson: Property.LongText({
      displayName: 'Product Sales Tax (JSON)',
      description:
        'Array of tax IDs applied on product sales. Example: ["95A1956E-E60A-4FAC-8EC4-C88EE7431280"]',
      required: false,
    }),
  },
  async run(context) {
    const {
      companyId,
      productName,
      productCode,
      productBuyCost,
      productUnitCost,
      productType,
      productQuantity,
      productNotes,
      productCategory,
      productSelectedCurrency,
      hsnCode,
      productStockManage,
      showInMenu,
      productSerialized,
      productBatched,
      productDietType,
      productBuyTaxJson,
      productSalesTaxJson,
    } = context.propsValue;

    const body: any = {
      CompanyID: companyId,
      ProductName: productName,
    };

    if (productCode) body.ProductCode = productCode;
    if (productBuyCost !== undefined && productBuyCost !== null)
      body.ProductBuyCost = productBuyCost;
    if (productUnitCost !== undefined && productUnitCost !== null)
      body.ProductUnitCost = productUnitCost;
    if (productType) body.ProductType = productType;
    if (productQuantity !== undefined && productQuantity !== null)
      body.ProductQuantity = productQuantity;
    if (productNotes) body.ProductNotes = productNotes;
    if (productCategory) body.ProductCategory = productCategory;
    if (productSelectedCurrency)
      body.ProductSelectedCurrency = productSelectedCurrency;
    if (hsnCode) body.HSNCode = hsnCode;
    if (productStockManage !== undefined)
      body.ProductStockManage = productStockManage ? 1 : 0;
    if (showInMenu !== undefined) body.ShowInMenu = showInMenu ? 1 : 0;
    if (productSerialized !== undefined)
      body.ProductSerialized = productSerialized ? 1 : 0;
    if (productBatched !== undefined)
      body.ProductBatched = productBatched ? 1 : 0;
    if (productDietType) body.ProductDietType = parseInt(productDietType);

    // Parse and add product buy tax
    if (productBuyTaxJson) {
      try {
        body.ProductBuyTax = JSON.parse(productBuyTaxJson);
      } catch (error) {
        throw new Error('Invalid ProductBuyTax JSON format');
      }
    }

    // Parse and add product sales tax
    if (productSalesTaxJson) {
      try {
        body.ProductSalesTax = JSON.parse(productSalesTaxJson);
      } catch (error) {
        throw new Error('Invalid ProductSalesTax JSON format');
      }
    }

    const accessToken = await getAccessToken(
      context.auth.props.email,
      context.auth.props.secret_text
    );

    const response = await makeRequest(
      accessToken,
      HttpMethod.POST,
      '/add_product',
      body
    );

    return response;
  },
});
