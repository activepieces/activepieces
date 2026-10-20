import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { shortIoAuth } from '../common/auth';
import { shortIoClient } from '../common/client';
import { shortIoLinks } from '../common/links';
import { shortIoSchemas } from '../common/output-schemas';
import { domainIdDropdown } from '../common/props';
import { shortIoValues } from '../common/values';

export const getLinkClicksAction = createAction({
  auth: shortIoAuth,
  name: 'get-link-clicks',
  classification: 'READ',
  displayName: 'Get Link Clicks',
  description: 'Retrieve click statistics for specific short links by their IDs.',
  audience: 'human',
  aiMetadata: {
    description:
      'Retrieves click counts for one or more short links (by link ID) on a domain, optionally for a start/end date range (both dates needed). Returns a map of link ID to clicks. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: shortIoSchemas.legacyLinkClicks,
  props: {
    domain: {
      ...domainIdDropdown,
      required: true,
      description: 'Select the domain containing the links',
    },
    ids: Property.Array({
      displayName: 'Link IDs',
      description: 'List of link IDs to fetch click statistics for (e.g., lnk_61Mb_0dnRUg3vvtmAPZh3dhQh6).',
      required: true,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'Start date for click statistics (optional). The calendar day you pick is sent as is.',
      required: false,
    }),
    endDate: Property.DateTime({
      displayName: 'End Date',
      description: 'End date for click statistics (optional). The calendar day you pick is sent as is.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const domain = shortIoLinks.parseDomainProp(propsValue.domain);
    const ids = shortIoValues.stringList(propsValue.ids);
    if (ids.length === 0) {
      throw new Error('At least one Link ID is required.');
    }
    const { startDate, endDate } = propsValue;
    if (Boolean(startDate) !== Boolean(endDate)) {
      throw new Error('Both Start Date and End Date must be provided if using a date range filter.');
    }
    const start = startDate ? shortIoValues.toApiDate({ value: startDate, label: 'Start date' }) : undefined;
    const end = endDate ? shortIoValues.toApiDate({ value: endDate, label: 'End date' }) : undefined;
    if (start && end && start > end) {
      throw new Error('Start date must not be after end date.');
    }
    try {
      const response = await shortIoClient.request({
        method: HttpMethod.GET,
        auth,
        base: 'stats',
        path: `/domain/${shortIoClient.domainIdSeg(domain.id)}/link_clicks`,
        query: { ids: ids.join(','), startDate: start, endDate: end },
      });
      const range = start && end ? ` for ${start} to ${end}` : '';
      return {
        success: true,
        message: `Retrieved click statistics for ${ids.length} link${ids.length > 1 ? 's' : ''}${range}`,
        data: shortIoLinks.isRecord(response) ? response : {},
      };
    } catch (error) {
      return shortIoClient.rethrowWithHint({ error, hints: { 404: 'Domain or links not found.' } });
    }
  },
});
