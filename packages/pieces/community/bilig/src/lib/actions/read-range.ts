import { createAction, Property } from '@activepieces/pieces-framework';
import { biligWorkpaperUtils } from '../common/workpaper';

export const readRange = createAction({
  name: 'read_range',
  displayName: 'Read Range',
  description: 'Read cell inputs and recalculated display values from WorkPaper JSON.',
  props: {
    workpaper: Property.Json({
      displayName: 'WorkPaper JSON',
      description: 'A Bilig-style WorkPaper JSON object with a sheets map.',
      required: true,
      defaultValue: biligWorkpaperUtils.createDemoWorkpaper(),
    }),
    sheet: Property.ShortText({
      displayName: 'Sheet',
      description: 'The sheet name to read.',
      required: true,
      defaultValue: 'Summary',
    }),
    range: Property.ShortText({
      displayName: 'Range',
      description: 'A1 range to read, for example A1:C5.',
      required: true,
      defaultValue: 'A1:B2',
    }),
  },
  async run(context) {
    return await biligWorkpaperUtils.readRange({
      workpaper: context.propsValue['workpaper'],
      sheet: context.propsValue['sheet'],
      range: context.propsValue['range'],
    });
  },
});
