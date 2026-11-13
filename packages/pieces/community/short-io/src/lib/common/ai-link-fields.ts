import { Property } from '@activepieces/pieces-framework';
import { shortIoLinkBody } from './link-body';
import { shortIoValues } from './values';

const linkSettingProps = {
  path: Property.ShortText({ displayName: 'Path (Slug)', description: 'Custom slug after the domain, e.g. spring-sale. Empty = Short.io generates one.', required: false }),
  title: Property.ShortText({ displayName: 'Title', required: false }),
  tags: Property.Array({ displayName: 'Tags', description: 'Tags for the link. On update this replaces the existing tags.', required: false }),
  folderId: Property.ShortText({ displayName: 'Folder ID', description: 'Folder ID from List Folders.', required: false }),
  utmSource: Property.ShortText({ displayName: 'UTM Source', required: false }),
  utmMedium: Property.ShortText({ displayName: 'UTM Medium', required: false }),
  utmCampaign: Property.ShortText({ displayName: 'UTM Campaign', required: false }),
  utmTerm: Property.ShortText({ displayName: 'UTM Term', required: false }),
  utmContent: Property.ShortText({ displayName: 'UTM Content', required: false }),
  redirectType: Property.StaticDropdown({
    displayName: 'Redirect Type',
    required: false,
    options: {
      disabled: false,
      options: [
        { label: '301 (Moved Permanently)', value: '301' },
        { label: '302 (Found)', value: '302' },
        { label: '303 (See Other)', value: '303' },
        { label: '307 (Temporary Redirect)', value: '307' },
        { label: '308 (Permanent Redirect)', value: '308' },
      ],
    },
  }),
  expiresAt: Property.ShortText({ displayName: 'Expires At', description: 'ISO 8601 date-time after which the link shows the expired page (it is not deleted).', required: false }),
  expiredURL: Property.ShortText({ displayName: 'Expired Redirect URL', description: 'Where visitors go after the link expires.', required: false }),
  clicksLimit: Property.Number({ displayName: 'Clicks Limit', description: 'Expire the link after this many clicks (minimum 1).', required: false }),
  deleteAt: Property.ShortText({
    displayName: 'Delete At',
    description: 'ISO 8601 date-time at which Short.io permanently deletes the link; must be at least 7 days ahead. Deletion may lag by up to 2 hours.',
    required: false,
  }),
};

function aiLinkBody({ values, now }: { values: Record<string, unknown>; now: number }): Record<string, unknown> {
  const { clicksLimit, redirectType } = shortIoLinkBody.validateLinkOptions({
    clicksLimit: values['clicksLimit'],
    splitPercent: undefined,
    redirectType: values['redirectType'],
  });
  const text = (key: string): string | undefined => {
    const value = values[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  };
  const tags = values['tags'] === undefined || values['tags'] === null ? undefined : shortIoValues.stringList(values['tags']);
  const expiresAt = text('expiresAt');
  const deleteAt = text('deleteAt');
  const originalURL = text('originalURL');
  return shortIoValues.compact({
    originalURL,
    path: text('path')?.replace(/^\/+/, ''),
    title: text('title'),
    tags,
    folderId: text('folderId'),
    utmSource: text('utmSource'),
    utmMedium: text('utmMedium'),
    utmCampaign: text('utmCampaign'),
    utmTerm: text('utmTerm'),
    utmContent: text('utmContent'),
    redirectType,
    expiresAt: expiresAt ? shortIoValues.toIsoDateTime({ value: expiresAt, label: 'Expires At' }) : undefined,
    expiredURL: text('expiredURL'),
    clicksLimit,
    ttl: deleteAt ? shortIoValues.deleteAtToIso({ value: deleteAt, now }) : undefined,
  });
}

export const shortIoAiLinkFields = { linkSettingProps, aiLinkBody };
