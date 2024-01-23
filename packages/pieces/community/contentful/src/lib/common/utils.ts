import { ContentFields } from 'contentful-management';
import camelCase from 'lodash/camelCase';
import startCase from 'lodash/startCase';

export const getLinkHelperText = (
  validations: ContentFields['validations']
) => {
  const mimes: string[] =
    validations?.find((v) => v['linkMimetypeGroup'])?.['linkMimetypeGroup'] ||
    [];
  const entryTypes: string[] =
    validations?.find((v) => v['linkContentType'])?.['linkContentType'] || [];
  const parts: string[] = [...mimes, ...entryTypes];
  return startCase(camelCase(parts.join(',')));
};
