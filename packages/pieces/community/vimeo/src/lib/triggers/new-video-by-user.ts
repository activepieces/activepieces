import { PiecePropValueSchema, Property, createTrigger, TriggerStrategy, AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { DedupeStrategy, Polling, pollingHelper, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

type Props = {
  userId: string;
};

const polling: Polling<AppConnectionValueForAuthProperty<typeof vimeoAuth>, Props> = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, propsValue, lastFetchEpochMS }) {
    const { userId } = propsValue;
    const response = await apiRequest({
      auth,
      path: `/users/${userId}/videos`,
      method: HttpMethod.GET,
      queryParams: {
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

export const newVideoByUser = createTrigger({
  name: 'new_video_by_user',
  displayName: 'New Video by User',
  description: 'Triggers when another specified user adds a video',
  auth: vimeoAuth,
  props: {
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'ID of the user to monitor for new videos',
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
    "uri": "/videos/1113800695",
    "name": "video title here",
    "description": "description here",
    "type": "video",
    "link": "https://i.vimeocdn.com/...",
    "player_embed_url": "https://i.vimeocdn.com/...",
    "duration": 62,
    "width": 640,
    "language": "en",
    "height": 360,
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
      "interactive": false,
      "buttons": {
        "watchlater": true,
        "share": true,
        "embed": true,
        "hd": false,
        "fullscreen": true,
        "scaling": true,
        "like": true
      },
      "logos": {
        "vimeo": true,
        "custom": {
          "active": false,
          "url": null,
          "link": null,
          "use_link": false,
          "sticky": false
        }
      },
      "play_button": {
        "position": "auto"
      },
      "title": {
        "name": "show",
        "owner": "show",
        "portrait": "show"
      },
      "end_screen": [],
      "playbar": true,
      "quality_selector": null,
      "pip": true,
      "autopip": true,
      "volume": true,
      "color": "00adef",
      "colors": {
        "color_one": "000000",
        "color_two": "00adef",
        "color_three": "ffffff",
        "color_four": "000000"
      },
      "event_schedule": true,
      "has_cards": false,
      "outro_type": "videos",
      "show_timezone": false,
      "cards": [],
      "airplay": true,
      "audio_tracks": true,
      "chapters": true,
      "chromecast": true,
      "closed_captions": true,
      "transcript": true,
      "skipping_forward": true,
      "ask_ai": true,
      "uri": null,
      "email_capture_form": [],
      "speed": true
    },
    "created_time": "2025-08-28T05:51:54+00:00",
    "modified_time": "2025-09-04T08:59:27+00:00",
    "release_time": "2025-08-28T05:51:54+00:00",
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
      "uri": "/videos/1113800695/pictures/2052390380",
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
      "resource_key": "2ab7656e4ebba9e6f65e37576885b28ddf992500",
      "default_picture": false
    },
    "tags": [],
    "stats": {
      "plays": 0
    },
    "categories": [],
    "uploader": {
      "pictures": {
        "uri": "/users/245851446/pictures/118131984",
        "active": true,
        "type": "custom",
        "base_link": "https://i.vimeocdn.com/...",
        "sizes": [
          {
            "width": 30,
            "height": 30,
            "link": "https://i.vimeocdn.com/..."
          },
        ],
        "resource_key": "ba73e4cd8767062609dda2dfcd4649727c2bb49d",
        "default_picture": false
      }
    },
    "metadata": {
      "connections": {
        "comments": {
          "uri": "/videos/1113800695/comments",
          "total": 0
        },
        "credits": {
          "uri": "/videos/1113800695/credits",
          "total": 0
        },
        "likes": {
          "uri": "/videos/1113800695/likes",
          "total": 0
        },
        "pictures": {
          "uri": "/videos/1113800695/pictures",
          "total": 1
        },
        "texttracks": {
          "uri": "/videos/1113800695/texttracks",
          "total": 0
        },
        "related": null,
        "recommendations": {
          "uri": "/videos/1113800695/recommendations",
          "resource_signature": "cf11ed146071dbd..."
        },
        "albums": {
          "uri": "/videos/1113800695/albums",
          "total": 0
        },
        "available_albums": {
          "uri": "/videos/1113800695/available_albums",
          "total": 1
        },
        "available_channels": {
          "uri": "/videos/1113800695/available_channels",
          "total": 0
        },
        "versions": {
          "uri": "/videos/1113800695/versions",
          "total": 1,
          "current_uri": "/videos/1113800695/versions/1110194140",
          "resource_key": "31c9e0964895318b48ccc6d94df5704452860e6d",
          "create_storyboard_id": "",
          "latest_incomplete_version": null
        }
      },
      "interactions": {
        "watchlater": {
          "uri": "/users/245851446/watchlater/1113800695",
          "added": false,
          "added_time": null
        },
        "report": {
          "uri": "/videos/1113800695/report",
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
        "view_team_members": {
          "uri": "/videos/1113800695/teammembers",
        },
        "edit": {
          "uri": "/videos/1113800695",
          "blocked_fields": [
            "custom_url"
          ]
        },
        "edit_content_rating": {
          "uri": "/videos/1113800695",
          "content_rating": [
            "language",
            "drugs",
            "violence",
            "nudity",
            "advertisement",
            "safe",
            "unrated"
          ]
        },
        "edit_privacy": {
          "uri": "/videos/1113800695",
          "content_type": "application/vnd.vimeo.video",
          "properties": [
            {
              "name": "privacy.view",
              "required": true,
              "options": [
                "anybody",
                "nobody",
                "password",
                "disable",
                "unlisted"
              ]
            }
          ]
        },
        "delete": {
          "uri": "/videos/1113800695",
        },
        "can_update_privacy_to_public": {
          "uri": "/videos/1113800695",
        },
        "trim": {
          "uri": "/videos/1113800695/cliptrim",
        },
        "validate": {
          "uri": "/videos/1113800695/validate",
        }
      },
      "is_vimeo_create": false,
      "is_screen_record": false
    },
    "manage_link": "/manage/videos/1113800695",
    "user": {
      "uri": "/users/245851446",
      "name": "Stefans Arya",
      "link": "https://i.vimeocdn.com/...",
      "capabilities": {
        "hasLiveSubscription": false,
        "hasEnterpriseLihp": false,
        "hasSvvTimecodedComments": false,
        "hasSimplifiedEnterpriseAccount": false,
        "hasManagementCapabilitiesForComments": true,
        "canViewSimplifiedCommentMentions": true
      },
      "location": "",
      "gender": "m",
      "bio": null,
      "short_bio": null,
      "created_time": "2025-08-25T16:22:03+00:00",
      "pictures": {
        "uri": "/users/245851446/pictures/118131984",
        "active": true,
        "type": "custom",
        "base_link": "https://i.vimeocdn.com/...",
        "sizes": [
          {
            "width": 30,
            "height": 30,
            "link": "https://i.vimeocdn.com/..."
          },
        ],
        "resource_key": "ba73e4cd8767062609dda2dfcd4649727c2bb49d",
        "default_picture": false
      },
      "websites": [],
      "metadata": {
        "connections": {
          "albums": {
            "uri": "/users/245851446/albums",
            "total": 1
          },
          "appearances": {
            "uri": "/users/245851446/appearances",
            "total": 0
          },
          "categories": {
            "uri": "/users/245851446/categories",
            "total": 0
          },
          "channels": {
            "uri": "/users/245851446/channels",
            "total": 0
          },
          "feed": {
            "uri": "/users/245851446/feed",
          },
          "followers": {
            "uri": "/users/245851446/followers",
            "total": 0
          },
          "following": {
            "uri": "/users/245851446/following",
            "total": 0
          },
          "groups": {
            "uri": "/users/245851446/groups",
            "total": 0
          },
          "likes": {
            "uri": "/users/245851446/likes",
            "total": 5
          },
          "membership": {
            "uri": "/users/245851446/membership/",
          },
          "moderated_channels": {
            "uri": "/users/245851446/channels?filter=moderated",
            "total": 0
          },
          "portfolios": {
            "uri": "/users/245851446/portfolios",
            "total": 0
          },
          "videos": {
            "uri": "/users/245851446/videos",
            "total": 1
          },
          "watchlater": {
            "uri": "/users/245851446/watchlater",
            "total": 0
          },
          "shared": {
            "uri": "/users/245851446/shared/videos",
            "total": 0
          },
          "pictures": {
            "uri": "/users/245851446/pictures",
            "total": 1
          },
          "watched_videos": {
            "uri": "/me/watched/videos",
            "total": 0
          },
          "folders_root": {
            "uri": "/users/245851446/folders/root",
          },
          "folders": {
            "uri": "/users/245851446/folders",
            "total": 1
          },
          "teams": {
            "uri": "/users/245851446/teams",
            "total": 1
          },
          "block": {
            "uri": "/me/block",
            "total": 0
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
      "preferences": {
        "videos": {
          "rating": [
            "unrated"
          ],
          "privacy": {
            "view": "anybody",
            "comments": "anybody",
            "embed": "public",
            "download": true,
            "add": true,
            "allow_share_link": true
          }
        },
        "webinar_registrant_lower_watermark_banner_dismissed": []
      },
      "content_filter": [
        "language",
        "drugs",
        "violence",
        "nudity",
        "safe",
        "unrated"
      ],
      "upload_quota": {
        "space": {
          "free": 1068989426,
          "max": 1073741824,
          "used": 4752398,
          "showing": "lifetime",
          "unit": "video_size"
        },
        "periodic": {
          "period": null,
          "unit": null,
          "free": null,
          "max": null,
          "used": null,
          "reset_date": null
        },
        "lifetime": {
          "unit": "video_size",
          "free": 1068989426,
          "max": 1073741824,
          "used": 4752398
        }
      },
      "resource_key": "670938330b60950d868b643b2e2ed768e987816a",
      "account": "free"
    },
    "last_user_action_event_date": "2025-09-04T08:59:27+00:00",
    "parent_folder": null,
    "review_page": {
      "active": false,
      "link": "https://i.vimeocdn.com/...",
      "is_shareable": true
    },
    "app": {
      "name": "Vimeo Site",
      "uri": "/apps/58479"
    },
    "play": {
      "status": "playable"
    },
    "status": "available",
    "resource_key": "c337eab5d7fee5eaa7a6e3f87147a6c170eedf35",
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
    "video_id": "1113800695"
  },
});