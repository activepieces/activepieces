import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlDiscountNode,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiFindDiscountByCode = createAction({
  auth: shopifyAuth,
  name: 'find_discount_by_code',
  classification: 'READ',
  displayName: 'Find Discount By Code',
  description: 'Look up the code discount that a redeem code belongs to.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Finds the code discount behind a code customers type, for example "SPRING15", and returns it with the same fields as get_discount (value, target, eligibility, limits, status). found=false (and every other field null or empty) when no discount uses that code. Use it to check whether a code exists before creating one, or to get the discount id for update_basic_discount_code, delete_discount or the redeem code actions. Needs the read_discounts access scope. Read-only.',
    idempotent: true,
  },
  props: {
    code: Property.ShortText({
      displayName: 'Code',
      description: 'The redeem code, for example "SPRING15".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const code = shopifyValues.nonEmpty(propsValue.code);
    if (!code) {
      throw new Error('Provide the code to look up.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      codeDiscountNodeByCode: GqlDiscountNode | null;
    }>({
      auth,
      query: `query FindDiscountByCode($code: String!) { codeDiscountNodeByCode(code: $code) { id discount: codeDiscount { ${shopifyFields.CODE_DISCOUNT_DETAIL_FIELDS} } } }`,
      variables: { code },
    });
    const node = data.codeDiscountNodeByCode;
    return {
      found: node !== null,
      ...shopifyMappers.mapDiscountNode(node ?? { id: '' }),
      ...(node ? {} : { id: null }),
      searched_code: code,
      redacted_fields: redactedFields,
    };
  },
});
