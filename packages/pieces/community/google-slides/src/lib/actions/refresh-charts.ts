import { createAction, Property } from '@activepieces/pieces-framework';
import { batchUpdate, getSlide, PageElement } from '../commons/common';
import { googleSlidesAuth } from '../auth';

export const refreshSheetsCharts = createAction({
  name: 'refresh_sheets_charts',
  displayName: 'Refresh Sheets Charts',
  description: 'Refresh all Google Sheets charts in the presentation',
  audience: 'both',
  aiMetadata: { description: 'Re-sync every embedded Google Sheets chart in a presentation to its source spreadsheet\'s current data, in a single batch update. Use this after the underlying Sheets data changes to bring the slide charts up to date. Not idempotent: each call issues a fresh refresh against live spreadsheet data, so repeated calls can pull different chart contents. Requires the presentation ID; charts that are not linked to Google Sheets are left untouched.', idempotent: false },
  auth: googleSlidesAuth,
  props: {
      presentation_id: Property.ShortText({
          displayName: 'Presentation ID',
          description: 'The ID of the presentation, between /d and /edit',
          required: true,
      }),
  },
  async run(context) {
      const { presentation_id } = context.propsValue;
      const { access_token } = context.auth;
      const presentation = await getSlide(access_token, presentation_id);
      
      const requests: { refreshSheetsChart: { objectId: string; }; }[] = [];
      
      presentation.slides?.forEach((slide) => {
        slide.pageElements?.forEach((element: PageElement) => {
          if (element.sheetsChart) {
            const refreshRequest = {
              refreshSheetsChart: {
                  objectId: element.objectId
              }
            };
            requests.push(refreshRequest);
          }
        });
      });
      
      if (requests.length > 0) {
          const result = await batchUpdate(access_token, presentation_id, requests);
          return {
              success: true,
              message: `Successfully refreshed ${requests.length} Google Sheets charts`,
              result: result
          };
      } else {
          return {
              success: false,
              message: 'No Google Sheets charts found in the presentation'
          };
      }
  }
});