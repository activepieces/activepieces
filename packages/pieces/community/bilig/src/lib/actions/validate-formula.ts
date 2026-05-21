import { createAction, Property } from '@activepieces/pieces-framework';
import { biligWorkpaperUtils } from '../common/workpaper';

export const validateFormula = createAction({
  name: 'validate_formula',
  displayName: 'Validate Formula',
  description: 'Check a WorkPaper formula string before using it in a workflow.',
  props: {
    formula: Property.LongText({
      displayName: 'Formula',
      description: 'Formula text, including the leading equals sign.',
      required: true,
      defaultValue: '=Inputs!B2*Inputs!B3',
    }),
  },
  async run(context) {
    return await biligWorkpaperUtils.validateFormula(context.propsValue['formula']);
  },
});
