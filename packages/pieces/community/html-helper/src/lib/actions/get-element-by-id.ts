import { createAction, Property } from '@activepieces/pieces-framework';
import { parse } from 'node-html-parser';

export const getElementById = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getElementById',
  displayName: 'Get Element By Id',
  description: 'Extract the attributes from an html eleement using its id',
  props: {
    html: Property.LongText({
      displayName: 'HTML',
      description: 'The HTML to extract the element from',
      required: true,
      
    }),
    elementId: Property.ShortText({
      displayName: 'Element Id',
      required: true,
    }),
  },
  async run(context) {

    const {
      html,
      elementId,
    } = context.propsValue;

    const htmlFromProps =  parse(html);
    
    const response = htmlFromProps.getElementById(elementId)
    if (!response) {
      throw new Error(`No element found with ID: ${elementId}`);
    }

    const attributes = {
      attrs: response.attributes,
      innerHTML : response.innerHTML,
      innerText : response.innerText,
      tagName : response.tagName,
      text : response.text,
      outerHTML : response.outerHTML,
      id: response.id,

    }
    return attributes;
  },
});

