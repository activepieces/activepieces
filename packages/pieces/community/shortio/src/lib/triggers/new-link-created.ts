
import { createTrigger, TriggerStrategy, PiecePropValueSchema, StaticPropsValue  } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { shortioAuth, shortioApiCall, shortioCommon, ShortioApiLink } from '../common';

type Props = {
  domain_id: string;
};

const polling: Polling<
  PiecePropValueSchema<typeof shortioAuth>, 
  Props
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const domain_id = propsValue.domain_id;
    const response = await shortioApiCall<ShortioApiLink>({
        apiKey: auth,
        method: HttpMethod.GET,
        resourceUri: '/api/links',
        query: {
            domain_id: domain_id,
            dateSortOrder: 'desc',
            limit: 50,
            ...(lastFetchEpochMS && { afterDate: new Date(lastFetchEpochMS).toISOString() })
        }
    });

    return response.links.map((link) => ({
      epochMilliSeconds: dayjs(link.createdAt).valueOf(),
      data: link,
    }));
  },
};

export const newLinkCreated = createTrigger({
auth: shortioAuth,
name: 'new_link_created',
displayName: 'New Link Created',
description: 'Fires when a new short link is created on a domain',
props: {
    domain_id: shortioCommon.domain_id,
},
sampleData: {
  "count": 5,
  "links": [
    {
      "originalURL": "https://example.com",
      "path": "locked",
      "idString": "lnk_61Ct_LhhzwbgKOP2IC0AQn2gyJ",
      "id": "lnk_61Ct_LhhzwbgKOP2IC0AQn2gyJ",
      "shortURL": "https://ezhil.short.gy/locked",
      "secureShortURL": "https://ezhil.short.gy/locked",
      "cloaking": false,
      "title": "Example: Locked URL with password \"123\"",
      "tags": [],
      "createdAt": "2025-07-16T07:22:54.897Z",
      "passwordContact": false,
      "skipQS": false,
      "archived": false,
      "DomainId": 1436197,
      "OwnerId": 1938304,
      "hasPassword": true,
      "User": {
        "id": 1938304,
        "name": "ezhil",
        "email": "example@gmail.com",
        "photoURL": "https://lh3.googleusercontent.com/a/ACg8ocLVEdkvIURx5B3dRiVaPcQCb8UCSKkWribRB45jP6Y4barE7LrE=s96-c"
      }
    },
    {
      "originalURL": "https://drive.google.com/uc?export=download&id=1s1QyKPdWg5uCzAEHqUMUir20odS1Nl-t",
      "path": "pdf",
      "idString": "lnk_61Ct_CtzwOmav8NGbIQI3bn9ni",
      "id": "lnk_61Ct_CtzwOmav8NGbIQI3bn9ni",
      "shortURL": "https://ezhil.short.gy/pdf",
      "secureShortURL": "https://ezhil.short.gy/pdf",
      "cloaking": false,
      "title": "Example: Download a file",
      "tags": [],
      "createdAt": "2025-07-16T07:22:54.854Z",
      "skipQS": false,
      "archived": false,
      "DomainId": 1436197,
      "OwnerId": 1938304,
      "hasPassword": false,
      "User": {
        "id": 1938304,
        "name": "ezhil",
        "email": "example@gmail.com",
        "photoURL": "https://lh3.googleusercontent.com/a/ACg8ocLVEdkvIURx5B3dRiVaPcQCb8UCSKkWribRB45jP6Y4barE7LrE=s96-c"
      }
    },
    {
      "originalURL": "https://help.short.io/en/articles/4065848-how-to-set-up-link-expiration-temporary-url",
      "path": "25.07.17",
      "idString": "lnk_61Ct_bs75GgKInEKAZc7qxQJ13",
      "id": "lnk_61Ct_bs75GgKInEKAZc7qxQJ13",
      "shortURL": "https://ezhil.short.gy/25.07.17",
      "secureShortURL": "https://ezhil.short.gy/25.07.17",
      "cloaking": false,
      "expiresAt": "2025-07-17T07:22:54.804Z",
      "title": "Example: Link will expire at July 17th, 2025 at 7:22:54 AM GMT+0",
      "tags": [],
      "createdAt": "2025-07-16T07:22:54.842Z",
      "skipQS": false,
      "archived": false,
      "DomainId": 1436197,
      "OwnerId": 1938304,
      "hasPassword": false,
      "User": {
        "id": 1938304,
        "name": "ezhil",
        "email": "example@gmail.com",
        "photoURL": "https://lh3.googleusercontent.com/a/ACg8ocLVEdkvIURx5B3dRiVaPcQCb8UCSKkWribRB45jP6Y4barE7LrE=s96-c"
      }
    },
    {
      "originalURL": "https://blog.short.io/mobile-targeting/",
      "path": "mobile",
      "idString": "lnk_61Ct_Y5qegbUj68VkJs1G4JEq6",
      "id": "lnk_61Ct_Y5qegbUj68VkJs1G4JEq6",
      "shortURL": "https://ezhil.short.gy/mobile",
      "secureShortURL": "https://ezhil.short.gy/mobile",
      "cloaking": false,
      "title": "Example: Mobile users will see different page",
      "tags": [],
      "androidURL": "https://play.google.com/store/apps/details?id=cm.shortcm.android",
      "iphoneURL": "https://blog.short.io/mobile-targeting/",
      "createdAt": "2025-07-16T07:22:54.830Z",
      "skipQS": false,
      "archived": false,
      "DomainId": 1436197,
      "OwnerId": 1938304,
      "hasPassword": false,
      "User": {
        "id": 1938304,
        "name": "ezhil",
        "email": "example@gmail.com",
        "photoURL": "https://lh3.googleusercontent.com/a/ACg8ocLVEdkvIURx5B3dRiVaPcQCb8UCSKkWribRB45jP6Y4barE7LrE=s96-c"
      }
    },
    {
      "originalURL": "https://blog.short.io/ab-testing/?test=a",
      "path": "ab-test",
      "idString": "lnk_61Ct_AnHowQl0hCajdHA3xTsng",
      "id": "lnk_61Ct_AnHowQl0hCajdHA3xTsng",
      "shortURL": "https://ezhil.short.gy/ab-test",
      "secureShortURL": "https://ezhil.short.gy/ab-test",
      "cloaking": false,
      "title": "Example: Split users for A/B test",
      "tags": [],
      "createdAt": "2025-07-16T07:22:54.814Z",
      "skipQS": false,
      "archived": false,
      "splitURL": "https://example.com",
      "DomainId": 1436197,
      "OwnerId": 1938304,
      "hasPassword": false,
      "User": {
        "id": 1938304,
        "name": "ezhil",
        "email": "example@gmail.com",
        "photoURL": "https://lh3.googleusercontent.com/a/ACg8ocLVEdkvIURx5B3dRiVaPcQCb8UCSKkWribRB45jP6Y4barE7LrE=s96-c"
      }
    }
  ],
  "nextPageToken": null
},
type: TriggerStrategy.POLLING,
async test(context) {
    return await pollingHelper.test(polling, {
        auth: context.auth,
        store: context.store,
        propsValue: context.propsValue,
        files: context.files,
    });
},
async onEnable(context) {
    await pollingHelper.onEnable(polling, {
        auth: context.auth,
        store: context.store,
        propsValue: context.propsValue,
    });
},

async onDisable(context) {
    await pollingHelper.onDisable(polling, {
        auth: context.auth,
        store: context.store,
        propsValue: context.propsValue,
    });
},

async run(context) {
    return await pollingHelper.poll(polling, {
        auth: context.auth,
        store: context.store,
        propsValue: context.propsValue,
        files: context.files,
    });
},
});
