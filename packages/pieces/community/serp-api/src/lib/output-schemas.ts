import { OutputSchema } from '@activepieces/pieces-framework';

const serpApiWebOrganicResultFields: OutputSchema['fields'] = [
  { key: 'position', label: 'Position', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'displayed_link', label: 'Displayed Link' },
  { key: 'snippet', label: 'Snippet' },
  { key: 'favicon', label: 'Favicon', format: 'image' },
];

export const searchAppleAppStoreOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'search_information',
          label: 'Search Information',
          children: [{ key: 'results_count', label: 'Results Count', format: 'number' }],
        },
        {
          key: 'organic_results',
          label: 'Apps',
          labelKey: 'title',
          listItems: [
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'id', label: 'App ID' },
            { key: 'title', label: 'Title' },
            { key: 'link', label: 'App Store Link', format: 'url' },
            { key: 'bundle_id', label: 'Bundle ID' },
            { key: 'version', label: 'Version' },
            { key: 'description', label: 'Description' },
            { key: 'age_rating', label: 'Age Rating' },
            { key: 'release_date', label: 'Release Date' },
            { key: 'seller_link', label: 'Seller Link', format: 'url' },
            {
              key: 'price',
              label: 'Price',
              children: [{ key: 'type', label: 'Price Type' }],
            },
            {
              key: 'rating',
              label: 'Ratings',
              listItems: [
                { key: 'type', label: 'Rating Type' },
                { key: 'rating', label: 'Rating', format: 'number' },
                { key: 'count', label: 'Rating Count', format: 'number' },
              ],
            },
            {
              key: 'genres',
              label: 'Genres',
              listItems: [{ key: 'name', label: 'Genre Name' }],
            },
            {
              key: 'developer',
              label: 'Developer',
              children: [
                { key: 'name', label: 'Developer Name' },
                { key: 'id', label: 'Developer ID' },
                { key: 'link', label: 'Developer Link', format: 'url' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const searchDuckduckgoOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'organic_results',
          label: 'Results',
          labelKey: 'title',
          listItems: [
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'title', label: 'Title' },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'snippet', label: 'Snippet' },
            { key: 'date', label: 'Date' },
            { key: 'favicon', label: 'Favicon', format: 'image' },
            {
              key: 'sitelinks',
              label: 'Sitelinks',
              labelKey: 'title',
              listItems: [
                { key: 'title', label: 'Title' },
                { key: 'link', label: 'Link', format: 'url' },
                { key: 'snippet', label: 'Snippet' },
              ],
            },
          ],
        },
        {
          key: 'related_searches',
          label: 'Related Searches',
          labelKey: 'query',
          listItems: [
            { key: 'query', label: 'Query' },
            { key: 'link', label: 'Link', format: 'url' },
          ],
        },
      ],
    },
  ],
};

export const searchGoogleMapsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'local_results',
          label: 'Places',
          labelKey: 'title',
          listItems: [
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'title', label: 'Title' },
            { key: 'place_id', label: 'Place ID' },
            { key: 'data_id', label: 'Data ID' },
            { key: 'data_cid', label: 'Data CID' },
            { key: 'rating', label: 'Rating', format: 'number' },
            { key: 'reviews', label: 'Review Count', format: 'number' },
            { key: 'price', label: 'Price Range' },
            { key: 'type', label: 'Primary Type' },
            { key: 'address', label: 'Address' },
            { key: 'phone', label: 'Phone' },
            { key: 'website', label: 'Website', format: 'url' },
            { key: 'hours', label: 'Hours' },
            {
              key: 'gps_coordinates',
              label: 'GPS Coordinates',
              children: [
                { key: 'latitude', label: 'Latitude', format: 'number' },
                { key: 'longitude', label: 'Longitude', format: 'number' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const searchBingOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'search_information',
          label: 'Search Information',
          children: [{ key: 'total_results', label: 'Total Results', format: 'number' }],
        },
        {
          key: 'organic_results',
          label: 'Results',
          labelKey: 'title',
          listItems: [
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'title', label: 'Title' },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'displayed_link', label: 'Displayed Link' },
            { key: 'snippet', label: 'Snippet' },
            { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
          ],
        },
      ],
    },
  ],
};

const googleTrendsRankedListFields: OutputSchema['fields'] = [
  { key: 'value', label: 'Trend Label' },
  { key: 'extracted_value', label: 'Extracted Value', format: 'number' },
  { key: 'link', label: 'Google Trends Link', format: 'url' },
];

export const searchGoogleTrendsAiOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'interest_over_time',
          label: 'Interest Over Time',
          children: [
            {
              key: 'timeline_data',
              label: 'Timeline',
              labelKey: 'date',
              listItems: [
                { key: 'date', label: 'Date' },
                { key: 'timestamp', label: 'Timestamp' },
                {
                  key: 'values',
                  label: 'Values',
                  labelKey: 'query',
                  listItems: [
                    { key: 'query', label: 'Query' },
                    { key: 'value', label: 'Value' },
                    { key: 'extracted_value', label: 'Extracted Value', format: 'number' },
                  ],
                },
              ],
            },
          ],
        },
        {
          key: 'related_topics',
          label: 'Related Topics',
          children: [
            {
              key: 'top',
              label: 'Top Topics',
              labelKey: 'value',
              listItems: [
                {
                  key: 'topic',
                  label: 'Topic',
                  children: [
                    { key: 'title', label: 'Title' },
                    { key: 'type', label: 'Type' },
                  ],
                },
                ...googleTrendsRankedListFields,
              ],
            },
            {
              key: 'rising',
              label: 'Rising Topics',
              labelKey: 'value',
              listItems: [
                {
                  key: 'topic',
                  label: 'Topic',
                  children: [
                    { key: 'title', label: 'Title' },
                    { key: 'type', label: 'Type' },
                  ],
                },
                ...googleTrendsRankedListFields,
              ],
            },
          ],
        },
        {
          key: 'related_queries',
          label: 'Related Queries',
          children: [
            {
              key: 'top',
              label: 'Top Queries',
              labelKey: 'query',
              listItems: [{ key: 'query', label: 'Query' }, ...googleTrendsRankedListFields],
            },
            {
              key: 'rising',
              label: 'Rising Queries',
              labelKey: 'query',
              listItems: [{ key: 'query', label: 'Query' }, ...googleTrendsRankedListFields],
            },
          ],
        },
        {
          key: 'compared_breakdown_by_region',
          label: 'Compared Breakdown By Region',
          labelKey: 'location',
          listItems: [
            { key: 'geo', label: 'Geo Code' },
            { key: 'location', label: 'Location' },
            { key: 'max_value_index', label: 'Max Value Index', format: 'number' },
            {
              key: 'values',
              label: 'Values',
              labelKey: 'query',
              listItems: [
                { key: 'query', label: 'Query' },
                { key: 'value', label: 'Value' },
                { key: 'extracted_value', label: 'Extracted Value', format: 'number' },
              ],
            },
          ],
        },
        {
          key: 'interest_by_region',
          label: 'Interest By Region',
          labelKey: 'location',
          listItems: [
            { key: 'geo', label: 'Geo Code' },
            { key: 'location', label: 'Location' },
            { key: 'max_value_index', label: 'Max Value Index', format: 'number' },
            { key: 'value', label: 'Value' },
            { key: 'extracted_value', label: 'Extracted Value', format: 'number' },
          ],
        },
      ],
    },
  ],
};

export const searchGoogleJobsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'jobs_results',
          label: 'Jobs',
          labelKey: 'title',
          listItems: [
            { key: 'title', label: 'Job Title' },
            { key: 'company_name', label: 'Company' },
            { key: 'location', label: 'Location' },
            { key: 'via', label: 'Source' },
            { key: 'description', label: 'Description' },
            { key: 'thumbnail', label: 'Company Logo', format: 'image' },
            { key: 'job_id', label: 'Job ID' },
            {
              key: 'detected_extensions',
              label: 'Details',
              children: [
                { key: 'posted_at', label: 'Posted At' },
                { key: 'schedule_type', label: 'Schedule Type' },
                { key: 'qualifications', label: 'Qualifications' },
              ],
            },
            {
              key: 'apply_options',
              label: 'Apply Options',
              labelKey: 'title',
              listItems: [
                { key: 'title', label: 'Source' },
                { key: 'link', label: 'Apply Link', format: 'url' },
              ],
            },
          ],
        },
        {
          key: 'serpapi_pagination',
          label: 'Pagination',
          children: [{ key: 'next_page_token', label: 'Next Page Token' }],
        },
      ],
    },
  ],
};

export const searchGoogleWebAiOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'search_information',
          label: 'Search Information',
          children: [
            { key: 'total_results', label: 'Total Results', format: 'number' },
            { key: 'time_taken_displayed', label: 'Time Taken (s)', format: 'number' },
          ],
        },
        {
          key: 'organic_results',
          label: 'Results',
          labelKey: 'title',
          listItems: serpApiWebOrganicResultFields,
        },
        {
          key: 'related_questions',
          label: 'Related Questions',
          labelKey: 'question',
          listItems: [
            { key: 'question', label: 'Question' },
            { key: 'snippet', label: 'Snippet' },
            { key: 'link', label: 'Link', format: 'url' },
          ],
        },
        {
          key: 'related_searches',
          label: 'Related Searches',
          labelKey: 'query',
          listItems: [
            { key: 'query', label: 'Query' },
            { key: 'link', label: 'Link', format: 'url' },
          ],
        },
      ],
    },
  ],
};

export const searchGoogleLensOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'ai_overview',
          label: 'AI Overview',
          children: [{ key: 'page_token', label: 'AI Overview Page Token' }],
        },
        {
          key: 'visual_matches',
          label: 'Visual Matches',
          labelKey: 'title',
          listItems: [
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'title', label: 'Title' },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'source', label: 'Source' },
            { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
          ],
        },
        {
          key: 'knowledge_graph',
          label: 'Knowledge Graph',
          children: [
            { key: 'title', label: 'Title' },
            { key: 'subtitle', label: 'Subtitle' },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
          ],
        },
      ],
    },
  ],
};

export const searchYoutubeAiOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'video_results',
          label: 'Videos',
          labelKey: 'title',
          listItems: [
            { key: 'title', label: 'Title' },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'video_id', label: 'Video ID' },
            { key: 'published_date', label: 'Published' },
            { key: 'views', label: 'Views', format: 'number' },
            { key: 'length', label: 'Length' },
            { key: 'description', label: 'Description' },
            {
              key: 'channel',
              label: 'Channel',
              children: [
                { key: 'name', label: 'Channel Name' },
                { key: 'link', label: 'Channel Link', format: 'url' },
                { key: 'verified', label: 'Verified', format: 'boolean' },
                { key: 'thumbnail', label: 'Channel Thumbnail', format: 'image' },
              ],
            },
            {
              key: 'thumbnail',
              label: 'Thumbnail',
              children: [{ key: 'static', label: 'Thumbnail Image', format: 'image' }],
            },
          ],
        },
        {
          key: 'shorts_results',
          label: 'Shorts',
          listItems: [
            { key: 'position_on_page', label: 'Position On Page', format: 'number' },
            {
              key: 'shorts',
              label: 'Shorts',
              labelKey: 'title',
              listItems: [
                { key: 'title', label: 'Title' },
                { key: 'link', label: 'Link', format: 'url' },
                { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
                { key: 'views', label: 'Views', format: 'number' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const searchGoogleScholarOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'organic_results',
          label: 'Results',
          labelKey: 'title',
          listItems: [
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'title', label: 'Title' },
            { key: 'result_id', label: 'Result ID' },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'snippet', label: 'Snippet' },
            {
              key: 'publication_info',
              label: 'Publication Info',
              children: [{ key: 'summary', label: 'Summary' }],
            },
            {
              key: 'resources',
              label: 'Resources',
              labelKey: 'title',
              listItems: [
                { key: 'title', label: 'Source' },
                { key: 'file_format', label: 'File Format' },
                { key: 'link', label: 'Link', format: 'url' },
              ],
            },
            {
              key: 'inline_links',
              label: 'Links',
              children: [
                {
                  key: 'cited_by',
                  label: 'Cited By',
                  children: [
                    { key: 'total', label: 'Citation Count', format: 'number' },
                    { key: 'link', label: 'Citations Link', format: 'url' },
                  ],
                },
                {
                  key: 'versions',
                  label: 'Versions',
                  children: [
                    { key: 'total', label: 'Version Count', format: 'number' },
                    { key: 'link', label: 'Versions Link', format: 'url' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const searchWalmartOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'organic_results',
          label: 'Products',
          labelKey: 'title',
          listItems: [
            { key: 'us_item_id', label: 'Item ID' },
            { key: 'product_id', label: 'Product ID' },
            { key: 'title', label: 'Title' },
            { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
            { key: 'rating', label: 'Rating', format: 'number' },
            { key: 'reviews', label: 'Review Count', format: 'number' },
            { key: 'seller_name', label: 'Seller Name' },
            { key: 'out_of_stock', label: 'Out Of Stock', format: 'boolean' },
            { key: 'free_shipping', label: 'Free Shipping', format: 'boolean' },
            { key: 'product_page_url', label: 'Product Page', format: 'url' },
            {
              key: 'primary_offer',
              label: 'Offer',
              children: [
                { key: 'offer_price', label: 'Price', format: 'currency' },
                { key: 'min_price', label: 'Minimum Price', format: 'currency' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const searchGoogleImagesOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'images_results',
          label: 'Images',
          labelKey: 'title',
          listItems: [
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'title', label: 'Title' },
            { key: 'link', label: 'Source Page Link', format: 'url' },
            { key: 'source', label: 'Source' },
            { key: 'original', label: 'Original Image', format: 'image' },
            { key: 'original_width', label: 'Width', format: 'number' },
            { key: 'original_height', label: 'Height', format: 'number' },
            { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
          ],
        },
        {
          key: 'related_searches',
          label: 'Related Searches',
          labelKey: 'query',
          listItems: [{ key: 'query', label: 'Query' }],
        },
      ],
    },
  ],
};

export const searchGoogleNewsAiOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'news_results',
          label: 'News',
          labelKey: 'title',
          listItems: [
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'title', label: 'Title' },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
            { key: 'date', label: 'Date' },
            { key: 'iso_date', label: 'ISO Date', format: 'datetime' },
            {
              key: 'source',
              label: 'Source',
              children: [
                { key: 'name', label: 'Source Name' },
                { key: 'icon', label: 'Source Icon', format: 'image' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const searchYelpOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'organic_results',
          label: 'Businesses',
          labelKey: 'title',
          listItems: [
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'title', label: 'Title' },
            { key: 'link', label: 'Link', format: 'url' },
            { key: 'price', label: 'Price Range' },
            { key: 'rating', label: 'Rating', format: 'number' },
            { key: 'reviews', label: 'Review Count', format: 'number' },
            { key: 'neighborhoods', label: 'Neighborhood' },
            { key: 'open_state', label: 'Open State' },
            { key: 'snippet', label: 'Snippet' },
            { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
            {
              key: 'categories',
              label: 'Categories',
              labelKey: 'title',
              listItems: [
                { key: 'title', label: 'Category' },
                { key: 'link', label: 'Link', format: 'url' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const searchGooglePlayOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'organic_results',
          label: 'Result Groups',
          listItems: [
            {
              key: 'items',
              label: 'Apps',
              labelKey: 'title',
              listItems: [
                { key: 'title', label: 'Title' },
                { key: 'link', label: 'Store Link', format: 'url' },
                { key: 'product_id', label: 'Product ID' },
                { key: 'rating', label: 'Rating', format: 'number' },
                { key: 'author', label: 'Developer' },
                { key: 'category', label: 'Category' },
                { key: 'downloads', label: 'Downloads' },
                { key: 'description', label: 'Description' },
                { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const searchGoogleShoppingOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'shopping_results',
          label: 'Products',
          labelKey: 'title',
          listItems: [
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'title', label: 'Title' },
            { key: 'product_id', label: 'Product ID' },
            { key: 'source', label: 'Source' },
            { key: 'price', label: 'Price' },
            { key: 'extracted_price', label: 'Extracted Price', format: 'number' },
            { key: 'old_price', label: 'Old Price' },
            { key: 'extracted_old_price', label: 'Extracted Old Price', format: 'number' },
            { key: 'rating', label: 'Rating', format: 'number' },
            { key: 'reviews', label: 'Review Count', format: 'number' },
            { key: 'snippet', label: 'Snippet' },
            { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
            { key: 'tag', label: 'Tag' },
            { key: 'delivery', label: 'Delivery' },
          ],
        },
      ],
    },
  ],
};

export const searchGoogleLocalServicesOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'local_ads',
          label: 'Local Service Ads',
          labelKey: 'title',
          listItems: [
            { key: 'title', label: 'Business Name' },
            { key: 'link', label: 'Profile Link', format: 'url' },
            { key: 'rating', label: 'Rating', format: 'number' },
            { key: 'reviews', label: 'Review Count', format: 'number' },
            { key: 'phone', label: 'Phone' },
            { key: 'type', label: 'Service Type' },
            { key: 'service_area', label: 'Service Area' },
            { key: 'years_in_business', label: 'Years In Business', format: 'number' },
            { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
            {
              key: 'hours',
              label: 'Hours',
              children: [{ key: 'currently', label: 'Currently' }],
            },
          ],
        },
      ],
    },
  ],
};

export const googleSearchOutputSchema: OutputSchema = searchGoogleWebAiOutputSchema;

export const googleNewsSearchOutputSchema: OutputSchema = searchGoogleNewsAiOutputSchema;

export const youtubeSearchOutputSchema: OutputSchema = searchYoutubeAiOutputSchema;

export const googleTrendsSearchOutputSchema: OutputSchema = searchGoogleTrendsAiOutputSchema;
