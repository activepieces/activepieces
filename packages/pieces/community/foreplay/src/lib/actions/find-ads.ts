import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ForeplayAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const findAds = createAction({
  auth: ForeplayAuth,
  name: 'find_ads',
  displayName: 'Find Ads',
  description: 'Find ads by domain, with optional filters like platform, dates, and more.',
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: "Finds all brands for this domain, then searches for their ads.",
      required: true,
    }),
    live: Property.StaticDropdown({
      displayName: 'Live Status',
      required: false,
      options: {
        options: [
          { label: 'Live Ads', value: 'true' },
          { label: 'Inactive Ads', value: 'false' },
        ],
      },
    }),
    display_format: Property.StaticMultiSelectDropdown({
      displayName: 'Display Format',
      required: false,
      options: {
        options: [
          { label: 'Video', value: 'video' },
          { label: 'Carousel', value: 'carousel' },
          { label: 'Image', value: 'image' },
          { label: 'DCO', value: 'dco' },
          { label: 'DPA', value: 'dpa' },
          { label: 'Multi Images', value: 'multi_images' },
          { label: 'Multi Videos', value: 'multi_videos' },
          { label: 'Multi Medias', value: 'multi_medias' },
          { label: 'Event', value: 'event' },
          { label: 'Text', value: 'text' },
        ],
      },
    }),
    publisher_platform: Property.StaticMultiSelectDropdown({
      displayName: 'Publisher Platform',
      required: false,
      options: {
        options: [
          { label: 'Facebook', value: 'facebook' },
          { label: 'Instagram', value: 'instagram' },
          { label: 'Audience Network', value: 'audience_network' },
          { label: 'Messenger', value: 'messenger' },
          { label: 'TikTok', value: 'tiktok' },
          { label: 'YouTube', value: 'youtube' },
          { label: 'LinkedIn', value: 'linkedin' },
          { label: 'Threads', value: 'threads' },
        ],
      },
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'YYYY-MM-DD',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'YYYY-MM-DD',
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order By',
      required: false,
      defaultValue: 'newest',
      options: {
        options: [
          { label: 'Newest', value: 'newest' },
          { label: 'Oldest', value: 'oldest' },
          { label: 'Longest Running', value: 'longest_running' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of ads to return (default 10, max 250).',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const props = context.propsValue;

    
    const brandsRes = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/brand/getBrandsByDomain?domain=${props.domain}`
    );
    console.log("Brands:", brandsRes);
    const brands = brandsRes?.data || [];
    if (brands.length === 0) {
      return [];
    }
    const brand_ids = brands.map((b: any) => b.id);

 
    const queryParams = new URLSearchParams();

    queryParams.append('brand_ids', brand_ids.join(','));
    if (props.live) queryParams.append('live', props.live);

    if (props.display_format?.length) {
      props.display_format.forEach((format: string) => {
        queryParams.append('display_format', format);
      });
    }

    if (props.publisher_platform?.length) {
      props.publisher_platform.forEach((platform: string) => {
        queryParams.append('publisher_platform', platform);
      });
    }

    if (props.start_date) queryParams.append('start_date', props.start_date);
    if (props.end_date) queryParams.append('end_date', props.end_date);
    if (props.order) queryParams.append('order', props.order);
    if (props.limit) queryParams.append('limit', props.limit.toString());

 
    const adsRes = await makeRequest(
      apiKey,
      HttpMethod.GET,
      `/brand/getAdsByBrandId?${queryParams.toString()}`
    );

    return adsRes?.data || [];
  },
});
