import { createAction, Property } from '@activepieces/pieces-framework';
import { biligWorkpaperUtils } from '../common/workpaper';

export const setCellAndVerify = createAction({
  name: 'set_cell_and_verify',
  displayName: 'Set Cell and Verify',
  description: 'Set one cell, recalculate a readback cell, and return verification details.',
  props: {
    workpaper: Property.Json({
      displayName: 'WorkPaper JSON',
      description: 'A Bilig-style WorkPaper JSON object with a sheets map.',
      required: true,
      defaultValue: biligWorkpaperUtils.createDemoWorkpaper(),
    }),
    sheet: Property.ShortText({
      displayName: 'Sheet',
      description: 'The sheet name to update.',
      required: true,
      defaultValue: 'Inputs',
    }),
    cell: Property.ShortText({
      displayName: 'Cell',
      description: 'A1 cell address to update.',
      required: true,
      defaultValue: 'B2',
    }),
    value: Property.LongText({
      displayName: 'Value',
      description: 'New cell value. Use JSON scalars such as 42, true, null, or a formula like =A1+B1.',
      required: true,
      defaultValue: '32',
    }),
    readbackCell: Property.ShortText({
      displayName: 'Readback Cell',
      description: 'A1 cell address to read after the update. Defaults to the updated cell.',
      required: false,
      defaultValue: 'B2',
    }),
    readbackSheet: Property.ShortText({
      displayName: 'Readback Sheet',
      description: 'Optional sheet name for the readback cell. Defaults to the updated sheet.',
      required: false,
      defaultValue: 'Summary',
    }),
    expectedReadback: Property.ShortText({
      displayName: 'Expected Readback',
      description: 'Optional expected display value for the readback cell.',
      required: false,
      defaultValue: '38400',
    }),
  },
  async run(context) {
    return await biligWorkpaperUtils.setCellAndVerify({
      workpaper: context.propsValue['workpaper'],
      sheet: context.propsValue['sheet'],
      cell: context.propsValue['cell'],
      value: context.propsValue['value'],
      readbackCell: context.propsValue['readbackCell'],
      readbackSheet: context.propsValue['readbackSheet'],
      expectedReadback: context.propsValue['expectedReadback'],
    });
  },
});
