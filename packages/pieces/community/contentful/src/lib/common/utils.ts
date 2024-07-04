import { camelCase, startCase } from '@activepieces/shared';
import { ContentFields } from 'contentful-management';

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
