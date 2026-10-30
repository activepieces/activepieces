import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostClient } from '../../common/client';
import { ghostSettingsOutputSchema } from '../../output-schemas';

const PUBLIC_SETTING_KEYS = [
  'title',
  'description',
  'logo',
  'cover_image',
  'icon',
  'accent_color',
  'locale',
  'timezone',
  'meta_title',
  'meta_description',
  'og_image',
  'og_title',
  'og_description',
  'twitter_image',
  'twitter_title',
  'twitter_description',
  'facebook',
  'twitter',
  'navigation',
  'secondary_navigation',
  'active_theme',
  'is_private',
  'default_content_visibility',
  'members_enabled',
  'members_invite_only',
  'members_signup_access',
  'members_support_address',
  'paid_members_enabled',
  'portal_name',
  'portal_plans',
  'portal_default_plan',
  'comments_enabled',
  'recommendations_enabled',
  'email_track_opens',
  'email_track_clicks',
  'donations_enabled',
  'donations_currency',
  'donations_suggested_amount',
  'editor_default_email_recipients',
  'default_email_address',
  'support_email_address',
] as const;

const parseValue = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value ?? null;
  }
  const text = value.trim();
  if (text.startsWith('[') || text.startsWith('{')) {
    try {
      return JSON.parse(text);
    } catch {
      return value;
    }
  }
  return value;
};

export const ghostGetSettings = createAction({
  auth: ghostAuth,
  name: 'ghost_get_settings',
  outputSchema: ghostSettingsOutputSchema,
  classification: 'READ',
  displayName: 'Get Settings',
  description: 'Get the publication settings: branding, SEO, navigation, timezone and membership options.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the publication settings an editor needs: title, description, branding images, accent color, locale and timezone, SEO and social meta, navigation menus, active theme, and membership, portal, comments and email-tracking options. Secrets such as Stripe or Mailgun keys and the site password are never returned. Use Get Site for the Ghost version and URL.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await ghostClient.request<{
      settings?: { key: string; value: unknown }[];
    }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/settings',
    });
    const byKey = new Map((response.settings ?? []).map((setting) => [setting.key, setting.value]));
    const result: Record<string, unknown> = {};
    for (const key of PUBLIC_SETTING_KEYS) {
      if (byKey.has(key)) {
        result[key] = parseValue(byKey.get(key));
      }
    }
    return result;
  },
});
