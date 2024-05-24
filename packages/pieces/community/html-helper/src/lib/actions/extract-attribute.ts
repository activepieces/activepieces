import { createAction, Property } from '@activepieces/pieces-framework';
import { parse } from 'node-html-parser';

export const extractElementByQuery = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'extractAttribute',
  displayName: 'Get Element by Query Selector',
  description: 'Extract the attributes from an html eleement using a query selector',
  props: {
    html: Property.LongText({
      displayName: 'HTML',
      description: 'The HTML to extract the element from',
      required: true,
      
    }),
    querySelector: Property.ShortText({
      displayName: 'Query Selector',
      description: 'See more here: https://www.w3schools.com/cssref/css_selectors.php',
      required: true,
    }),
  },
  async run(context) {

    const {
      html,
      querySelector,
    } = context.propsValue;

    const htmlFromProps =  parse(html);
    
    const response = htmlFromProps.querySelector(querySelector)
    if (!response) {
      throw new Error(`No element found with query selector: ${querySelector}`);
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

