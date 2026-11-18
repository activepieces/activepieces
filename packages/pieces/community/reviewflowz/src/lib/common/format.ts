function platformName(slug: string | null | undefined): string {
  if (!slug) {
    return '';
  }
  return (
    NAMED_PLATFORMS[slug] ??
    slug
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}

function campaignLabel(campaign: { name: string; channel: string; state: string }): string {
  const channel = CHANNEL_NAMES[campaign.channel] ?? campaign.channel;
  const state = STATE_NAMES[campaign.state] ?? campaign.state;
  return `${campaign.name} · ${channel} · ${state}`;
}

const NAMED_PLATFORMS: Record<string, string> = {
  google_maps: 'Google Maps',
  app_store: 'App Store',
  g2: 'G2',
  bbb: 'BBB',
  better_business_bureau: 'Better Business Bureau',
  tripadvisor: 'Tripadvisor',
  trustpilot: 'Trustpilot',
  yelp: 'Yelp',
  capterra: 'Capterra',
  facebook: 'Facebook',
  booking_com: 'Booking.com',
  airbnb: 'Airbnb',
  expedia: 'Expedia',
  glassdoor: 'Glassdoor',
  google_play: 'Google Play',
};

const CHANNEL_NAMES: Record<string, string> = { email: 'Email', sms: 'Text', whatsapp: 'WhatsApp' };

const STATE_NAMES: Record<string, string> = { active: 'on', paused: 'paused', draft: 'off' };

export const reviewflowzFormat = { platformName, campaignLabel };
