import { PiecePropValueSchema, createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof vimeoAuth>, object> = {
  strategy: DedupeStrategy.LAST_ITEM,
  async items({ auth, lastItemId }) {
    const response = await apiRequest({
      auth,
      path: '/me/likes',
      method: HttpMethod.GET,
      queryParams: {
        per_page: '50',
      },
    });

    const likedVideos = response.body.data || [];
    const newVideos = [];

    for (const video of likedVideos) {
      const videoId = video.uri.split('/').pop();

      if(videoId === lastItemId) break;

      newVideos.push(video);
      video.video_id = videoId;
    }

    return newVideos.map((video) => ({
      id: video.uri.split('/').pop(),
      data: video,
    }));
  },
};

export const newVideoLiked = createTrigger({
  name: 'new_video_liked',
  displayName: 'New Video I\'ve Liked',
  description: 'Triggers when you like a new video on Vimeo',
  auth: vimeoAuth,
  props: {
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
    "uri": "/videos/874196439",
    "name": "video title here",
    "description": "description here",
    "type": "video",
    "link": "https://i.vimeocdn.com/...",
    "player_embed_url": "https://i.vimeocdn.com/...",
    "duration": 93,
    "width": 1920,
    "language": null,
    "height": 1440,
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
    "created_time": "2023-10-13T19:55:47+00:00",
    "modified_time": "2025-08-28T06:42:07+00:00",
    "release_time": "2023-10-13T19:55:47+00:00",
    "content_rating": [
      "safe"
    ],
    "content_rating_class": "safe",
    "rating_mod_locked": false,
    "license": null,
    "privacy": {
      "view": "anybody",
      "embed": "public",
      "download": false,
      "add": false,
      "comments": "nobody"
    },
    "pictures": {
      "uri": "/videos/874196439/pictures/1738058620",
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
      "resource_key": "9a71a32cf2ecedc9f3b545775f8ca3d5ddd41927",
      "default_picture": false
    },
    "tags": [],
    "stats": {
      "plays": 8
    },
    "categories": [],
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
          "uri": "/videos/874196439/comments",
          "total": 0
        },
        "credits": {
          "uri": "/videos/874196439/credits",
          "total": 0
        },
        "likes": {
          "uri": "/videos/874196439/likes",
          "total": 1
        },
        "pictures": {
          "uri": "/videos/874196439/pictures",
          "total": 1
        },
        "texttracks": {
          "uri": "/videos/874196439/texttracks",
          "total": 0
        },
        "related": {
          "uri": "/me/likes?per_page=50&offset=1",
        },
        "recommendations": {
          "uri": "/videos/874196439/recommendations",
          "resource_signature": "9333ef3d898bc05..."
        },
        "versions": {
          "uri": "/videos/874196439/versions",
          "total": 1,
          "current_uri": "/videos/874196439/versions/852877470",
          "resource_key": "8b228d8b3b2e4ba34f917da8942060a36c393b8e",
          "create_storyboard_id": "",
          "latest_incomplete_version": null
        }
      },
      "interactions": {
        "watchlater": {
          "uri": "/users/245851446/watchlater/874196439",
          "added": false,
          "added_time": null
        },
        "like": {
          "uri": "/users/245851446/likes/874196439",
          "added": true,
          "added_time": "2025-08-28T06:42:07+00:00",
          "show_count": true
        },
        "report": {
          "uri": "/videos/874196439/report",
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
          "uri": "/videos/874196439",
        },
        "validate": {
          "uri": "/videos/874196439/validate",
        }
      },
      "is_vimeo_create": false,
      "is_screen_record": false
    },
    "user": {
      "uri": "/users/209307138",
      "name": "yoixym",
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
      "location": "",
      "gender": "",
      "bio": null,
      "short_bio": null,
      "created_time": "2023-10-13T19:50:49+00:00",
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
            "uri": "/users/209307138/albums",
            "total": 0
          },
          "appearances": {
            "uri": "/users/209307138/appearances",
            "total": 0
          },
          "channels": {
            "uri": "/users/209307138/channels",
            "total": 0
          },
          "feed": {
            "uri": "/users/209307138/feed",
          },
          "followers": {
            "uri": "/users/209307138/followers",
            "total": 0
          },
          "following": {
            "uri": "/users/209307138/following",
            "total": 0
          },
          "groups": {
            "uri": "/users/209307138/groups",
            "total": 0
          },
          "likes": {
            "uri": "/users/209307138/likes",
            "total": 0
          },
          "membership": {
            "uri": "/users/209307138/membership/",
          },
          "moderated_channels": {
            "uri": "/users/209307138/channels?filter=moderated",
            "total": 0
          },
          "portfolios": {
            "uri": "/users/209307138/portfolios",
            "total": 0
          },
          "videos": {
            "uri": "/users/209307138/videos",
            "total": 1
          },
          "shared": {
            "uri": "/users/209307138/shared/videos",
            "total": 0
          },
          "pictures": {
            "uri": "/users/209307138/pictures",
            "total": 0
          },
          "folders_root": {
            "uri": "/users/209307138/folders/root",
          },
          "teams": {
            "uri": "/users/209307138/teams",
            "total": 1
          }
        },
        "interactions": {
          "follow": {
            "added": false,
            "added_time": null,
            "uri": "/users/245851446/following/209307138",
          },
          "block": {
            "uri": "/me/block/209307138",
            "added": false,
            "added_time": null
          },
          "report": {
            "uri": "/users/209307138/report",
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
        "formatted_address": "",
        "latitude": null,
        "longitude": null,
        "city": null,
        "state": null,
        "neighborhood": null,
        "sub_locality": null,
        "state_iso_code": null,
        "country": null,
        "country_iso_code": null
      },
      "skills": [],
      "available_for_hire": false,
      "can_work_remotely": false,
      "resource_key": "a6c815dde7cb470b723c5f84f95490a93b5b9ebe",
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
    "resource_key": "9a3efa06004dd8574c0274c72ef7c1967223b51d",
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
    "has_audio": true,
    "video_id": "874196439"
  },
});
