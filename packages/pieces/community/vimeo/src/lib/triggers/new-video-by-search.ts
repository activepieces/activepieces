import { PiecePropValueSchema, Property, createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

type Props = {
  query: string;
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof vimeoAuth>, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { query } = propsValue;
    const response = await apiRequest({
      auth,
      path: '/videos',
      method: HttpMethod.GET,
      queryParams: {
        query: query,
        sort: 'date',
        direction: 'desc',
        per_page: '50',
      },
    });

    const videos = response.body.data || [];
    const newVideos = [];

    for (const video of videos) {
      const videoId = video.uri.split('/').pop();
      const createdTime = dayjs(video.created_time).valueOf();

      // If we have a last fetch time and this video is newer, add it to new videos
      if (lastFetchEpochMS && createdTime > lastFetchEpochMS) {
        newVideos.push(video);
      }
      // If no last fetch time (first run), add all videos
      else if (!lastFetchEpochMS) {
        newVideos.push(video);
      }

      video.video_id = videoId;
    }

    return newVideos.map((video) => ({
      epochMilliSeconds: dayjs(video.created_time).valueOf(),
      data: video,
    }));
  },
};

export const newVideoBySearch = createTrigger({
  name: 'new_video_by_search',
  displayName: 'New Video by Search',
  description: 'Triggers when a new video is added that matches a search query',
  auth: vimeoAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search term to monitor for new videos',
      required: true,
    }),
  },
  type: TriggerStrategy.POLLING,
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
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  sampleData: {
    "uri": "/videos/1113154536",
    "name": "video title here",
    "description": "video description here",
    "type": "video",
    "link": "https://i.vimeocdn.com/...",
    "player_embed_url": "https://i.vimeocdn.com/...",
    "duration": 50,
    "width": 854,
    "language": "en",
    "height": 480,
    "embed": {
      "html": "<iframe>...</iframe>",
      "badges": {
        "hdr": false,
        "live": {
          "streaming": false,
          "archived": false
        },
        "staff_pick": {
          "normal": false,
          "best_of_the_month": false,
          "best_of_the_year": false,
          "premiere": false
        },
        "vod": false,
        "weekend_challenge": false
      },
      "interactive": false
    },
    "created_time": "2025-08-26T08:31:14+00:00",
    "modified_time": "2025-08-26T08:36:31+00:00",
    "release_time": "2025-08-26T08:31:14+00:00",
    "content_rating": [
      "unrated"
    ],
    "content_rating_class": "unrated",
    "rating_mod_locked": false,
    "license": null,
    "privacy": {
      "view": "anybody",
      "embed": "public",
      "download": false,
      "add": true,
      "comments": "anybody"
    },
    "pictures": {
      "uri": "/videos/1113154536/pictures/2051589675",
      "active": true,
      "type": "custom",
      "base_link": "https://i.vimeocdn.com/...",
      "sizes": [
        {
          "width": 100,
          "height": 75,
          "link": "https://i.vimeocdn.com/...",
          "link_with_play_button": "https://i.vimeocdn.com/..."
        },
      ],
      "resource_key": "ef0dea8128a2a68334c50085e2d63a41451c5c53",
      "default_picture": false
    },
    "tags": [],
    "stats": {
      "plays": 0
    },
    "categories": [
      {
        "uri": "/categories/sports",
        "name": "Sports",
        "link": "https://i.vimeocdn.com/...",
        "top_level": true,
        "is_deprecated": false,
        "pictures": {
          "uri": "/videos/675717426/pictures/1369315527",
          "active": true,
          "type": "custom",
          "base_link": "https://i.vimeocdn.com/...",
          "sizes": [
            {
              "width": 100,
              "height": 75,
              "link": "https://i.vimeocdn.com/...",
              "link_with_play_button": "https://i.vimeocdn.com/..."
            },
          ],
          "resource_key": "e7ccae157d596d301b025fb8e06905432dd2bbcc",
          "default_picture": false
        },
        "last_video_featured_time": "2025-08-25T21:44:03+00:00",
        "parent": null,
        "metadata": {
          "connections": {
            "channels": {
              "uri": "/categories/sports/channels",
              "total": 36269
            },
            "groups": {
              "uri": "/categories/sports/groups",
              "total": 9880
            },
            "users": {
              "uri": "/categories/sports/users",
              "total": 1624624
            },
            "videos": {
              "uri": "/categories/sports/videos",
              "total": 406609
            }
          },
          "interactions": {
            "follow": {
              "added": false,
              "added_time": null,
              "uri": "/users/245851446/categories/sports"
            }
          }
        },
        "subcategories": [],
        "icon": {
          "uri": "/categories/sports/icon",
          "active": false,
          "type": "custom",
          "base_link": "https://i.vimeocdn.com/...",
          "sizes": [
            {
              "width": 20,
              "height": 20,
              "link": "https://i.vimeocdn.com/..."
            },
          ],
          "resource_key": "73fb2a40655c2a497cc42463c07cf4637b0320f1",
          "default_picture": false
        },
        "resource_key": "24145eed0412385437c5a34fa732d3f90dd1dd3a"
      },
      {
        "uri": "/categories/music",
        "name": "Music",
        "link": "https://i.vimeocdn.com/...",
        "top_level": true,
        "is_deprecated": false,
        "pictures": {
          "uri": "/videos/938646663/pictures/1840111294",
          "active": true,
          "type": "custom",
          "base_link": "https://i.vimeocdn.com/...",
          "sizes": [
            {
              "width": 100,
              "height": 75,
              "link": "https://i.vimeocdn.com/...",
              "link_with_play_button": "https://i.vimeocdn.com/..."
            },
          ],
          "resource_key": "3f234a7cf900bca1890657a283c2e28a95849ffa",
          "default_picture": false
        },
        "last_video_featured_time": "2025-08-25T21:49:43+00:00",
        "parent": null,
        "metadata": {
          "connections": {
            "channels": {
              "uri": "/categories/music/channels",
              "total": 61540
            },
            "groups": {
              "uri": "/categories/music/groups",
              "total": 12618
            },
            "users": {
              "uri": "/categories/music/users",
              "total": 3004223
            },
            "videos": {
              "uri": "/categories/music/videos",
              "total": 656341
            }
          },
          "interactions": {
            "follow": {
              "added": false,
              "added_time": null,
              "uri": "/users/245851446/categories/music"
            }
          }
        },
        "subcategories": [],
        "icon": {
          "uri": "/categories/music/icon",
          "active": false,
          "type": "custom",
          "base_link": "https://i.vimeocdn.com/...",
          "sizes": [
            {
              "width": 20,
              "height": 20,
              "link": "https://i.vimeocdn.com/..."
            },
          ],
          "resource_key": "2216bf78a10b0823b64cb837d337143474f2014d",
          "default_picture": false
        },
        "resource_key": "a35d9defa20ba9be724f10f368f50ef539de9210"
      }
    ],
    "uploader": {
      "pictures": {
        "uri": null,
        "active": false,
        "type": "default",
        "base_link": "https://i.vimeocdn.com/...",
        "sizes": [
          {
            "width": 30,
            "height": 30,
            "link": "https://i.vimeocdn.com/..."
          },
        ],
        "resource_key": "06cd312fcc3908e2d839aeb00ccaaf434acb0859",
        "default_picture": true
      }
    },
    "metadata": {
      "connections": {
        "comments": {
          "uri": "/videos/1113154536/comments",
          "total": 0
        },
        "credits": {
          "uri": "/videos/1113154536/credits",
          "total": 0
        },
        "likes": {
          "uri": "/videos/1113154536/likes",
          "total": 0
        },
        "pictures": {
          "uri": "/videos/1113154536/pictures",
          "total": 1
        },
        "texttracks": {
          "uri": "/videos/1113154536/texttracks",
          "total": 0
        },
        "related": {
          "uri": "/videos?query=soccer&sort=date&direction=desc&per_page=1&offset=1",
        },
        "recommendations": {
          "uri": "/videos/1113154536/recommendations",
          "resource_signature": "d50ecaf..."
        },
        "albums": {
          "uri": "/videos/1113154536/albums",
          "total": 0
        },
        "available_albums": {
          "uri": "/videos/1113154536/available_albums",
          "total": 1
        },
        "available_channels": {
          "uri": "/videos/1113154536/available_channels",
          "total": 0
        },
        "versions": {
          "uri": "/videos/1113154536/versions",
          "total": 1,
          "current_uri": "/videos/1113154536/versions/1109484176",
          "resource_key": "51635bdd6f9aa94785a469c6cd030a6b95eaed06",
          "create_storyboard_id": "",
          "latest_incomplete_version": null
        }
      },
      "interactions": {
        "watchlater": {
          "uri": "/users/245851446/watchlater/1113154536",
          "added": false,
          "added_time": null
        },
        "like": {
          "uri": "/users/245851446/likes/1113154536",
          "added": false,
          "added_time": null,
          "show_count": true
        },
        "report": {
          "uri": "/videos/1113154536/report",
          "reason": [
            "pornographic",
            "harassment",
            "ripoff",
            "incorrect rating",
            "spam",
            "causes harm",
            "csam",
            "voting misinformation"
          ]
        },
        "can_update_privacy_to_public": {
          "uri": "/videos/1113154536",
        },
        "validate": {
          "uri": "/videos/1113154536/validate",
        }
      },
      "is_vimeo_create": false,
      "is_screen_record": false
    },
    "user": {
      "uri": "/users/245890681",
      "name": "john michal",
      "link": "https://i.vimeocdn.com/...",
      "capabilities": {
        "hasLiveSubscription": false,
        "hasEnterpriseLihp": false,
        "hasSvvTimecodedComments": false,
        "hasSimplifiedEnterpriseAccount": false,
        "hasManagementCapabilitiesForComments": true,
        "hasDetailedVideoVersionHistory": false,
        "canViewSimplifiedCommentMentions": true
      },
      "location": "India Gate, New Delhi, Delhi, India",
      "gender": "m",
      "bio": "Welcome to Castle - A collaboration platform for creators and teams to build ideas together.",
      "short_bio": "Modern platform for collaboration and creativity.",
      "created_time": "2025-08-26T08:18:12+00:00",
      "pictures": {
        "uri": null,
        "active": false,
        "type": "default",
        "base_link": "https://i.vimeocdn.com/...",
        "sizes": [
          {
            "width": 30,
            "height": 30,
            "link": "https://i.vimeocdn.com/..."
          },
        ],
        "resource_key": "06cd312fcc3908e2d839aeb00ccaaf434acb0859",
        "default_picture": true
      },
      "websites": [],
      "metadata": {
        "connections": {
          "albums": {
            "uri": "/users/245890681/albums",
            "total": 0
          },
          "appearances": {
            "uri": "/users/245890681/appearances",
            "total": 0
          },
          "channels": {
            "uri": "/users/245890681/channels",
            "total": 0
          },
          "feed": {
            "uri": "/users/245890681/feed",
          },
          "followers": {
            "uri": "/users/245890681/followers",
            "total": 0
          },
          "following": {
            "uri": "/users/245890681/following",
            "total": 1
          },
          "groups": {
            "uri": "/users/245890681/groups",
            "total": 0
          },
          "likes": {
            "uri": "/users/245890681/likes",
            "total": 1
          },
          "membership": {
            "uri": "/users/245890681/membership/",
          },
          "moderated_channels": {
            "uri": "/users/245890681/channels?filter=moderated",
            "total": 0
          },
          "portfolios": {
            "uri": "/users/245890681/portfolios",
            "total": 0
          },
          "videos": {
            "uri": "/users/245890681/videos",
            "total": 1
          },
          "shared": {
            "uri": "/users/245890681/shared/videos",
            "total": 0
          },
          "pictures": {
            "uri": "/users/245890681/pictures",
            "total": 0
          },
          "folders_root": {
            "uri": "/users/245890681/folders/root",
          },
          "teams": {
            "uri": "/users/245890681/teams",
            "total": 1
          }
        },
        "interactions": {
          "follow": {
            "added": false,
            "added_time": null,
            "uri": "/users/245851446/following/245890681",
          },
          "block": {
            "uri": "/me/block/245890681",
            "added": false,
            "added_time": null
          },
          "report": {
            "uri": "/users/245890681/report",
            "reason": [
              "inappropriate avatar",
              "spammy",
              "bad videos",
              "creepy",
              "not playing nice",
              "impersonation",
              "inappropriate job post"
            ]
          }
        }
      },
      "location_details": {
        "formatted_address": "India Gate, New Delhi, Delhi, India",
        "latitude": 28.6110878,
        "longitude": 77.23452,
        "city": "New Delhi",
        "state": "Delhi",
        "neighborhood": null,
        "sub_locality": "India Gate",
        "state_iso_code": "DL",
        "country": "India",
        "country_iso_code": "IN"
      },
      "skills": [],
      "available_for_hire": false,
      "can_work_remotely": false,
      "resource_key": "8af8f8b57045046bbb85a0a892a1c2e913086768",
      "account": "free"
    },
    "app": {
      "name": "Vimeo Site",
      "uri": "/apps/58479"
    },
    "play": {
      "status": "playable"
    },
    "status": "available",
    "resource_key": "fbacfa620edc8a5c9c5b2f95ab18de13a501fc58",
    "upload": {
      "status": "complete",
      "link": null,
      "upload_link": null,
      "form": null,
      "approach": null,
      "size": null,
      "redirect_url": null
    },
    "transcode": {
      "status": "complete"
    },
    "is_playable": true,
    "has_audio": false,
    "video_id": "1113154536"
  },
});