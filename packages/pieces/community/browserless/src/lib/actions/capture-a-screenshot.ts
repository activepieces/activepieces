import { createAction } from '@activepieces/pieces-framework';
import { screenshot_props } from '../common/props';
import { makeRequest, handleBinaryResponse } from '../common/requests';
import { validate_props } from '../common/validations';

export const capture_screenshot = createAction({
  name: 'capture_screenshot',
  displayName: 'Capture Screenshot',
  description: 'Take a screenshot of a page.',
  props: screenshot_props,
  async run(context) {
    // Add validation without changing structure
    await validate_props.capture_screenshot(context.propsValue);

    const url = context.propsValue.page_url;
    const fullPage = context.propsValue.capture_full_page;
    const type = context.propsValue.image_type;
    const token = context.auth as string;

    const response = await makeRequest('/screenshot', token, {
      url,
      options: {
        fullPage,
        type: type || 'png'
      }
    });

    const screenshot = await handleBinaryResponse(response);
    return {
      screenshot,
      type: type || 'png'
    };
  }
});
