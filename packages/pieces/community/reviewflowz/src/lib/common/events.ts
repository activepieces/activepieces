import { ReviewflowzEvent } from './types';

export const reviewflowzEvents: ReviewflowzEvent[] = [
  {
    "type": "review.created",
    "group": "Reviews",
    "label": "New Review",
    "description": "Triggers when a new review is found on one of your sources.",
    "important": true,
    "detail": "A new review was found. A source's first import of its history sends none.",
    "sample": {
      "id": "evt_4821",
      "type": "review.created",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rev_918273",
          "source": "src_4812",
          "platform": "google_maps",
          "location": "loc_87",
          "rating": 5,
          "title": null,
          "text": "Booked the summit tickets online and skipped the whole queue. The view at sunset was worth every euro, and the staff on the second floor were patient with our kids.",
          "pros": null,
          "cons": null,
          "language": "en",
          "reviewer": {
            "name": "Maya Chen",
            "company": null,
            "avatar_url": null
          },
          "url": "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sChdDSUhNMG9nS0VJQ0FnTURRazh2cG5RRRAB",
          "date": "2026-11-09T18:32:00Z",
          "removed": false,
          "removed_at": null,
          "previous_version": null,
          "root_review": "rev_918273",
          "latest_version": true,
          "tags": [
            {
              "id": "tag_3",
              "name": "Tickets"
            }
          ],
          "owners": [],
          "owner_suggestions": [],
          "topics": [
            {
              "topic": "Staff",
              "subtopic": "Friendliness",
              "sentiment": "positive",
              "sentiment_score": 0.86,
              "excerpt": "the staff on the second floor were patient with our kids"
            }
          ],
          "created_at": "2026-11-10T08:40:09Z",
          "updated_at": "2026-11-10T09:30:00Z",
          "media": {
            "photos": [],
            "videos": []
          },
          "reply": null
        },
        "source": "src_4812"
      }
    }
  },
  {
    "type": "review.updated",
    "group": "Reviews",
    "label": "Review Edited",
    "description": "Triggers when a reviewer edits their review. You get the new version.",
    "important": false,
    "detail": "The reviewer edited their review. The event carries the new version.",
    "sample": {
      "id": "evt_4821",
      "type": "review.updated",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rev_918273",
          "source": "src_4812",
          "platform": "google_maps",
          "location": "loc_87",
          "rating": 5,
          "title": null,
          "text": "Booked the summit tickets online and skipped the whole queue. The view at sunset was worth every euro, and the staff on the second floor were patient with our kids.",
          "pros": null,
          "cons": null,
          "language": "en",
          "reviewer": {
            "name": "Maya Chen",
            "company": null,
            "avatar_url": null
          },
          "url": "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sChdDSUhNMG9nS0VJQ0FnTURRazh2cG5RRRAB",
          "date": "2026-11-09T18:32:00Z",
          "removed": false,
          "removed_at": null,
          "previous_version": null,
          "root_review": "rev_918273",
          "latest_version": true,
          "tags": [
            {
              "id": "tag_3",
              "name": "Tickets"
            }
          ],
          "owners": [],
          "owner_suggestions": [],
          "topics": [
            {
              "topic": "Staff",
              "subtopic": "Friendliness",
              "sentiment": "positive",
              "sentiment_score": 0.86,
              "excerpt": "the staff on the second floor were patient with our kids"
            }
          ],
          "created_at": "2026-11-10T08:40:09Z",
          "updated_at": "2026-11-10T09:30:00Z",
          "media": {
            "photos": [],
            "videos": []
          },
          "reply": null
        },
        "source": "src_4812",
        "reason": null,
        "previous_version": "rev_918201"
      }
    }
  },
  {
    "type": "review.removed",
    "group": "Reviews",
    "label": "Review Removed",
    "description": "Triggers when a review is taken down on the platform, or hidden as not recommended.",
    "important": false,
    "detail": "The review was taken down on the platform, or hidden as not recommended.",
    "sample": {
      "id": "evt_4821",
      "type": "review.removed",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rev_918273",
          "source": "src_4812",
          "platform": "google_maps",
          "location": "loc_87",
          "rating": 5,
          "title": null,
          "text": "Booked the summit tickets online and skipped the whole queue. The view at sunset was worth every euro, and the staff on the second floor were patient with our kids.",
          "pros": null,
          "cons": null,
          "language": "en",
          "reviewer": {
            "name": "Maya Chen",
            "company": null,
            "avatar_url": null
          },
          "url": "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sChdDSUhNMG9nS0VJQ0FnTURRazh2cG5RRRAB",
          "date": "2026-11-09T18:32:00Z",
          "removed": false,
          "removed_at": null,
          "previous_version": null,
          "root_review": "rev_918273",
          "latest_version": true,
          "tags": [
            {
              "id": "tag_3",
              "name": "Tickets"
            }
          ],
          "owners": [],
          "owner_suggestions": [],
          "topics": [
            {
              "topic": "Staff",
              "subtopic": "Friendliness",
              "sentiment": "positive",
              "sentiment_score": 0.86,
              "excerpt": "the staff on the second floor were patient with our kids"
            }
          ],
          "created_at": "2026-11-10T08:40:09Z",
          "updated_at": "2026-11-10T09:30:00Z",
          "media": {
            "photos": [],
            "videos": []
          },
          "reply": null
        },
        "source": "src_4812",
        "reason": null,
        "previous_version": null
      }
    }
  },
  {
    "type": "review.reinstated",
    "group": "Reviews",
    "label": "Review Reinstated",
    "description": "Triggers when a removed review is back on the platform.",
    "important": false,
    "detail": "A removed review is back on the platform.",
    "sample": {
      "id": "evt_4821",
      "type": "review.reinstated",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rev_918273",
          "source": "src_4812",
          "platform": "google_maps",
          "location": "loc_87",
          "rating": 5,
          "title": null,
          "text": "Booked the summit tickets online and skipped the whole queue. The view at sunset was worth every euro, and the staff on the second floor were patient with our kids.",
          "pros": null,
          "cons": null,
          "language": "en",
          "reviewer": {
            "name": "Maya Chen",
            "company": null,
            "avatar_url": null
          },
          "url": "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sChdDSUhNMG9nS0VJQ0FnTURRazh2cG5RRRAB",
          "date": "2026-11-09T18:32:00Z",
          "removed": false,
          "removed_at": null,
          "previous_version": null,
          "root_review": "rev_918273",
          "latest_version": true,
          "tags": [
            {
              "id": "tag_3",
              "name": "Tickets"
            }
          ],
          "owners": [],
          "owner_suggestions": [],
          "topics": [
            {
              "topic": "Staff",
              "subtopic": "Friendliness",
              "sentiment": "positive",
              "sentiment_score": 0.86,
              "excerpt": "the staff on the second floor were patient with our kids"
            }
          ],
          "created_at": "2026-11-10T08:40:09Z",
          "updated_at": "2026-11-10T09:30:00Z",
          "media": {
            "photos": [],
            "videos": []
          },
          "reply": null
        },
        "source": "src_4812",
        "reason": null,
        "previous_version": null
      }
    }
  },
  {
    "type": "review.deleted",
    "group": "Reviews",
    "label": "Review Deleted",
    "description": "Triggers when a review is deleted from Reviewflowz.",
    "important": false,
    "detail": "We deleted the review. Deleting a source sends source.deleted instead.",
    "sample": {
      "id": "evt_4821",
      "type": "review.deleted",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rev_918273",
          "deleted": true
        },
        "source": "src_4812"
      }
    }
  },
  {
    "type": "review.enriched",
    "group": "Reviews",
    "label": "Review Analyzed",
    "description": "Triggers when a new review gets its sentiment, topics, tags and team members.",
    "important": true,
    "detail": "Sentiment, topics, tags and owners were added to a new review.",
    "sample": {
      "id": "evt_4821",
      "type": "review.enriched",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rev_918273",
          "source": "src_4812",
          "platform": "google_maps",
          "location": "loc_87",
          "rating": 5,
          "title": null,
          "text": "Booked the summit tickets online and skipped the whole queue. The view at sunset was worth every euro, and the staff on the second floor were patient with our kids.",
          "pros": null,
          "cons": null,
          "language": "en",
          "reviewer": {
            "name": "Maya Chen",
            "company": null,
            "avatar_url": null
          },
          "url": "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sChdDSUhNMG9nS0VJQ0FnTURRazh2cG5RRRAB",
          "date": "2026-11-09T18:32:00Z",
          "removed": false,
          "removed_at": null,
          "previous_version": null,
          "root_review": "rev_918273",
          "latest_version": true,
          "tags": [
            {
              "id": "tag_3",
              "name": "Tickets"
            }
          ],
          "owners": [],
          "owner_suggestions": [],
          "topics": [
            {
              "topic": "Staff",
              "subtopic": "Friendliness",
              "sentiment": "positive",
              "sentiment_score": 0.86,
              "excerpt": "the staff on the second floor were patient with our kids"
            }
          ],
          "created_at": "2026-11-10T08:40:09Z",
          "updated_at": "2026-11-10T09:30:00Z",
          "media": {
            "photos": [],
            "videos": []
          },
          "reply": null
        },
        "source": "src_4812"
      }
    }
  },
  {
    "type": "review.tagged",
    "group": "Reviews",
    "label": "Review Tagged",
    "description": "Triggers when a tag is added to a review.",
    "important": false,
    "detail": "A tag was added to the review.",
    "sample": {
      "id": "evt_4821",
      "type": "review.tagged",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rev_918273",
          "source": "src_4812",
          "platform": "google_maps",
          "location": "loc_87",
          "rating": 5,
          "title": null,
          "text": "Booked the summit tickets online and skipped the whole queue. The view at sunset was worth every euro, and the staff on the second floor were patient with our kids.",
          "pros": null,
          "cons": null,
          "language": "en",
          "reviewer": {
            "name": "Maya Chen",
            "company": null,
            "avatar_url": null
          },
          "url": "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sChdDSUhNMG9nS0VJQ0FnTURRazh2cG5RRRAB",
          "date": "2026-11-09T18:32:00Z",
          "removed": false,
          "removed_at": null,
          "previous_version": null,
          "root_review": "rev_918273",
          "latest_version": true,
          "tags": [
            {
              "id": "tag_3",
              "name": "Tickets"
            }
          ],
          "owners": [],
          "owner_suggestions": [],
          "topics": [
            {
              "topic": "Staff",
              "subtopic": "Friendliness",
              "sentiment": "positive",
              "sentiment_score": 0.86,
              "excerpt": "the staff on the second floor were patient with our kids"
            }
          ],
          "created_at": "2026-11-10T08:40:09Z",
          "updated_at": "2026-11-10T09:30:00Z",
          "media": {
            "photos": [],
            "videos": []
          },
          "reply": null
        },
        "source": "src_4812",
        "tag": "tag_3"
      }
    }
  },
  {
    "type": "review.untagged",
    "group": "Reviews",
    "label": "Review Untagged",
    "description": "Triggers when a tag is taken off a review.",
    "important": false,
    "detail": "A tag was taken off the review.",
    "sample": {
      "id": "evt_4821",
      "type": "review.untagged",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rev_918273",
          "source": "src_4812",
          "platform": "google_maps",
          "location": "loc_87",
          "rating": 5,
          "title": null,
          "text": "Booked the summit tickets online and skipped the whole queue. The view at sunset was worth every euro, and the staff on the second floor were patient with our kids.",
          "pros": null,
          "cons": null,
          "language": "en",
          "reviewer": {
            "name": "Maya Chen",
            "company": null,
            "avatar_url": null
          },
          "url": "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sChdDSUhNMG9nS0VJQ0FnTURRazh2cG5RRRAB",
          "date": "2026-11-09T18:32:00Z",
          "removed": false,
          "removed_at": null,
          "previous_version": null,
          "root_review": "rev_918273",
          "latest_version": true,
          "tags": [
            {
              "id": "tag_3",
              "name": "Tickets"
            }
          ],
          "owners": [],
          "owner_suggestions": [],
          "topics": [
            {
              "topic": "Staff",
              "subtopic": "Friendliness",
              "sentiment": "positive",
              "sentiment_score": 0.86,
              "excerpt": "the staff on the second floor were patient with our kids"
            }
          ],
          "created_at": "2026-11-10T08:40:09Z",
          "updated_at": "2026-11-10T09:30:00Z",
          "media": {
            "photos": [],
            "videos": []
          },
          "reply": null
        },
        "source": "src_4812",
        "tag": "tag_3"
      }
    }
  },
  {
    "type": "review.owner_assigned",
    "group": "Reviews",
    "label": "Team Member Credited",
    "description": "Triggers when a team member is credited for a review.",
    "important": false,
    "detail": "A team member was credited for the review.",
    "sample": {
      "id": "evt_4821",
      "type": "review.owner_assigned",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rev_918273",
          "source": "src_4812",
          "platform": "google_maps",
          "location": "loc_87",
          "rating": 5,
          "title": null,
          "text": "Booked the summit tickets online and skipped the whole queue. The view at sunset was worth every euro, and the staff on the second floor were patient with our kids.",
          "pros": null,
          "cons": null,
          "language": "en",
          "reviewer": {
            "name": "Maya Chen",
            "company": null,
            "avatar_url": null
          },
          "url": "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sChdDSUhNMG9nS0VJQ0FnTURRazh2cG5RRRAB",
          "date": "2026-11-09T18:32:00Z",
          "removed": false,
          "removed_at": null,
          "previous_version": null,
          "root_review": "rev_918273",
          "latest_version": true,
          "tags": [
            {
              "id": "tag_3",
              "name": "Tickets"
            }
          ],
          "owners": [],
          "owner_suggestions": [],
          "topics": [
            {
              "topic": "Staff",
              "subtopic": "Friendliness",
              "sentiment": "positive",
              "sentiment_score": 0.86,
              "excerpt": "the staff on the second floor were patient with our kids"
            }
          ],
          "created_at": "2026-11-10T08:40:09Z",
          "updated_at": "2026-11-10T09:30:00Z",
          "media": {
            "photos": [],
            "videos": []
          },
          "reply": null
        },
        "source": "src_4812",
        "owner": "own_7"
      }
    }
  },
  {
    "type": "review.owner_unassigned",
    "group": "Reviews",
    "label": "Team Member Credit Removed",
    "description": "Triggers when a team member's credit for a review is taken off.",
    "important": false,
    "detail": "A team member's credit for the review was taken off.",
    "sample": {
      "id": "evt_4821",
      "type": "review.owner_unassigned",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rev_918273",
          "source": "src_4812",
          "platform": "google_maps",
          "location": "loc_87",
          "rating": 5,
          "title": null,
          "text": "Booked the summit tickets online and skipped the whole queue. The view at sunset was worth every euro, and the staff on the second floor were patient with our kids.",
          "pros": null,
          "cons": null,
          "language": "en",
          "reviewer": {
            "name": "Maya Chen",
            "company": null,
            "avatar_url": null
          },
          "url": "https://www.google.com/maps/reviews/data=!4m8!14m7!1m6!2m5!1sChdDSUhNMG9nS0VJQ0FnTURRazh2cG5RRRAB",
          "date": "2026-11-09T18:32:00Z",
          "removed": false,
          "removed_at": null,
          "previous_version": null,
          "root_review": "rev_918273",
          "latest_version": true,
          "tags": [
            {
              "id": "tag_3",
              "name": "Tickets"
            }
          ],
          "owners": [],
          "owner_suggestions": [],
          "topics": [
            {
              "topic": "Staff",
              "subtopic": "Friendliness",
              "sentiment": "positive",
              "sentiment_score": 0.86,
              "excerpt": "the staff on the second floor were patient with our kids"
            }
          ],
          "created_at": "2026-11-10T08:40:09Z",
          "updated_at": "2026-11-10T09:30:00Z",
          "media": {
            "photos": [],
            "videos": []
          },
          "reply": null
        },
        "source": "src_4812",
        "owner": "own_7"
      }
    }
  },
  {
    "type": "reply.drafted",
    "group": "Replies",
    "label": "Reply Drafted",
    "description": "Triggers when a reply draft is written, by a person or the AI agent.",
    "important": false,
    "detail": "A reply draft was written, by a person or the AI agent.",
    "sample": {
      "id": "evt_4821",
      "type": "reply.drafted",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rpl_7",
          "review": "rev_1",
          "origin": "reviewflowz",
          "status": "draft",
          "text": "Thank you, Maya! We're glad the summit tickets saved you the queue. See you next time.",
          "author": {
            "type": "user",
            "name": "Sofia Martin"
          },
          "via": "reviewflowz",
          "published_at": null,
          "editable": true,
          "deletable": true,
          "created_at": "2026-11-10T09:05:12Z",
          "updated_at": "2026-11-10T09:05:12Z"
        },
        "source": "src_4812",
        "stage": null
      }
    }
  },
  {
    "type": "reply.submitted",
    "group": "Replies",
    "label": "Reply Submitted",
    "description": "Triggers when a reply is sent to a platform that checks replies before they go live.",
    "important": false,
    "detail": "A reply was sent to a platform that checks replies before they go live.",
    "sample": {
      "id": "evt_4821",
      "type": "reply.submitted",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rpl_7",
          "review": "rev_1",
          "origin": "reviewflowz",
          "status": "submitted",
          "text": "Thank you, Maya! We're glad the summit tickets saved you the queue. See you next time.",
          "author": {
            "type": "user",
            "name": "Sofia Martin"
          },
          "via": "reviewflowz",
          "published_at": null,
          "editable": false,
          "deletable": false,
          "created_at": "2026-11-10T09:05:12Z",
          "updated_at": "2026-11-10T09:05:12Z"
        },
        "source": "src_4812",
        "stage": null
      }
    }
  },
  {
    "type": "reply.published",
    "group": "Replies",
    "label": "Reply Published",
    "description": "Triggers when a reply goes live on the platform.",
    "important": false,
    "detail": "A reply went live on the platform.",
    "sample": {
      "id": "evt_4821",
      "type": "reply.published",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rpl_7",
          "review": "rev_1",
          "origin": "reviewflowz",
          "status": "published",
          "text": "Thank you, Maya! We're glad the summit tickets saved you the queue. See you next time.",
          "author": {
            "type": "user",
            "name": "Sofia Martin"
          },
          "via": "reviewflowz",
          "published_at": "2026-11-10T09:30:00Z",
          "editable": true,
          "deletable": false,
          "created_at": "2026-11-10T09:05:12Z",
          "updated_at": "2026-11-10T09:30:00Z"
        },
        "source": "src_4812",
        "stage": null
      }
    }
  },
  {
    "type": "reply.updated",
    "group": "Replies",
    "label": "Reply Edited",
    "description": "Triggers when a live reply is edited.",
    "important": false,
    "detail": "A live reply was edited.",
    "sample": {
      "id": "evt_4821",
      "type": "reply.updated",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rpl_7",
          "review": "rev_1",
          "origin": "reviewflowz",
          "status": "published",
          "text": "Thank you, Maya! We're glad the summit tickets saved you the queue. See you next time.",
          "author": {
            "type": "user",
            "name": "Sofia Martin"
          },
          "via": "reviewflowz",
          "published_at": "2026-11-11T16:02:00Z",
          "editable": true,
          "deletable": false,
          "created_at": "2026-11-10T09:05:12Z",
          "updated_at": "2026-11-11T16:02:00Z"
        },
        "source": "src_4812",
        "stage": null
      }
    }
  },
  {
    "type": "reply.failed",
    "group": "Replies",
    "label": "Reply Failed",
    "description": "Triggers when a reply could not be written or published.",
    "important": false,
    "detail": "A reply could not be written or published.",
    "sample": {
      "id": "evt_4821",
      "type": "reply.failed",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "rpl_7",
          "review": "rev_1",
          "origin": "reviewflowz",
          "status": "failed",
          "text": "Thank you, Maya! We're glad the summit tickets saved you the queue. See you next time.",
          "author": {
            "type": "user",
            "name": "Sofia Martin"
          },
          "via": "reviewflowz",
          "published_at": null,
          "editable": false,
          "deletable": true,
          "created_at": "2026-11-10T09:05:12Z",
          "updated_at": "2026-11-10T09:05:12Z"
        },
        "source": "src_4812",
        "stage": "publish"
      }
    }
  },
  {
    "type": "source.created",
    "group": "Sources",
    "label": "New Source",
    "description": "Triggers when a source (a listing we collect reviews from) is added.",
    "important": false,
    "detail": "A source was added.",
    "sample": {
      "id": "evt_4821",
      "type": "source.created",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "src_4812",
          "url": "https://maps.app.goo.gl/Gjo5NDggCfPg8EWL8",
          "platform": "google_maps",
          "name": "Tour Eiffel",
          "location": "loc_87",
          "domain": "toureiffel.paris",
          "external_id": "10222232094831998944",
          "product": null,
          "address": {
            "line1": "Av. Gustave Eiffel",
            "line2": null,
            "city": "Paris",
            "postal_code": "75007",
            "country": "FR"
          },
          "status": "synced",
          "rating": {
            "score": 4.7,
            "count": 500407,
            "stars": {
              "1": 7324,
              "2": 5102,
              "3": 18447,
              "4": 71324,
              "5": 398210
            }
          },
          "last_synced_at": "2026-11-10T08:40:12Z",
          "dimensions": {
            "region": "Europe"
          },
          "created_at": "2026-02-03T14:05:51Z",
          "deleted": false
        }
      }
    }
  },
  {
    "type": "source.synced",
    "group": "Sources",
    "label": "Source Checked",
    "description": "Triggers when a source finishes checking for new reviews.",
    "important": false,
    "detail": "A source finished checking for reviews.",
    "sample": {
      "id": "evt_4821",
      "type": "source.synced",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "src_4812",
          "url": "https://maps.app.goo.gl/Gjo5NDggCfPg8EWL8",
          "platform": "google_maps",
          "name": "Tour Eiffel",
          "location": "loc_87",
          "domain": "toureiffel.paris",
          "external_id": "10222232094831998944",
          "product": null,
          "address": {
            "line1": "Av. Gustave Eiffel",
            "line2": null,
            "city": "Paris",
            "postal_code": "75007",
            "country": "FR"
          },
          "status": "synced",
          "rating": {
            "score": 4.7,
            "count": 500407,
            "stars": {
              "1": 7324,
              "2": 5102,
              "3": 18447,
              "4": 71324,
              "5": 398210
            }
          },
          "last_synced_at": "2026-11-10T08:40:12Z",
          "dimensions": {
            "region": "Europe"
          },
          "created_at": "2026-02-03T14:05:51Z",
          "deleted": false
        },
        "initial": false,
        "new_reviews": 3
      }
    }
  },
  {
    "type": "source.access_lost",
    "group": "Sources",
    "label": "Source Access Lost",
    "description": "Triggers when we can no longer reach a source through its connected account.",
    "important": false,
    "detail": "We can no longer reach the source through its connected account.",
    "sample": {
      "id": "evt_4821",
      "type": "source.access_lost",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "src_4812",
          "url": "https://maps.app.goo.gl/Gjo5NDggCfPg8EWL8",
          "platform": "google_maps",
          "name": "Tour Eiffel",
          "location": "loc_87",
          "domain": "toureiffel.paris",
          "external_id": "10222232094831998944",
          "product": null,
          "address": {
            "line1": "Av. Gustave Eiffel",
            "line2": null,
            "city": "Paris",
            "postal_code": "75007",
            "country": "FR"
          },
          "status": "synced",
          "rating": {
            "score": 4.7,
            "count": 500407,
            "stars": {
              "1": 7324,
              "2": 5102,
              "3": 18447,
              "4": 71324,
              "5": 398210
            }
          },
          "last_synced_at": "2026-11-10T08:40:12Z",
          "dimensions": {
            "region": "Europe"
          },
          "created_at": "2026-02-03T14:05:51Z",
          "deleted": false
        },
        "state": "access_lost",
        "reason": null
      }
    }
  },
  {
    "type": "source.access_restored",
    "group": "Sources",
    "label": "Source Access Restored",
    "description": "Triggers when access to a source works again.",
    "important": false,
    "detail": "Access to the source works again.",
    "sample": {
      "id": "evt_4821",
      "type": "source.access_restored",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "src_4812",
          "url": "https://maps.app.goo.gl/Gjo5NDggCfPg8EWL8",
          "platform": "google_maps",
          "name": "Tour Eiffel",
          "location": "loc_87",
          "domain": "toureiffel.paris",
          "external_id": "10222232094831998944",
          "product": null,
          "address": {
            "line1": "Av. Gustave Eiffel",
            "line2": null,
            "city": "Paris",
            "postal_code": "75007",
            "country": "FR"
          },
          "status": "synced",
          "rating": {
            "score": 4.7,
            "count": 500407,
            "stars": {
              "1": 7324,
              "2": 5102,
              "3": 18447,
              "4": 71324,
              "5": 398210
            }
          },
          "last_synced_at": "2026-11-10T08:40:12Z",
          "dimensions": {
            "region": "Europe"
          },
          "created_at": "2026-02-03T14:05:51Z",
          "deleted": false
        }
      }
    }
  },
  {
    "type": "source.decommissioned",
    "group": "Sources",
    "label": "Listing Taken Down",
    "description": "Triggers when a listing is taken down on the platform for good.",
    "important": false,
    "detail": "The listing was taken down on the platform for good.",
    "sample": {
      "id": "evt_4821",
      "type": "source.decommissioned",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "src_4812",
          "url": "https://maps.app.goo.gl/Gjo5NDggCfPg8EWL8",
          "platform": "google_maps",
          "name": "Tour Eiffel",
          "location": "loc_87",
          "domain": "toureiffel.paris",
          "external_id": "10222232094831998944",
          "product": null,
          "address": {
            "line1": "Av. Gustave Eiffel",
            "line2": null,
            "city": "Paris",
            "postal_code": "75007",
            "country": "FR"
          },
          "status": "synced",
          "rating": {
            "score": 4.7,
            "count": 500407,
            "stars": {
              "1": 7324,
              "2": 5102,
              "3": 18447,
              "4": 71324,
              "5": 398210
            }
          },
          "last_synced_at": "2026-11-10T08:40:12Z",
          "dimensions": {
            "region": "Europe"
          },
          "created_at": "2026-02-03T14:05:51Z",
          "deleted": false
        }
      }
    }
  },
  {
    "type": "source.deleted",
    "group": "Sources",
    "label": "Source Deleted",
    "description": "Triggers when a source is deleted.",
    "important": false,
    "detail": "A source was deleted.",
    "sample": {
      "id": "evt_4821",
      "type": "source.deleted",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "src_4812",
          "url": "https://maps.app.goo.gl/Gjo5NDggCfPg8EWL8",
          "platform": "google_maps",
          "name": "Tour Eiffel",
          "location": "loc_87",
          "domain": "toureiffel.paris",
          "external_id": "10222232094831998944",
          "product": null,
          "address": {
            "line1": "Av. Gustave Eiffel",
            "line2": null,
            "city": "Paris",
            "postal_code": "75007",
            "country": "FR"
          },
          "status": "synced",
          "rating": {
            "score": 4.7,
            "count": 500407,
            "stars": {
              "1": 7324,
              "2": 5102,
              "3": 18447,
              "4": 71324,
              "5": 398210
            }
          },
          "last_synced_at": "2026-11-10T08:40:12Z",
          "dimensions": {
            "region": "Europe"
          },
          "created_at": "2026-02-03T14:05:51Z",
          "deleted": true
        }
      }
    }
  },
  {
    "type": "rating.changed",
    "group": "Ratings",
    "label": "Rating Changed",
    "description": "Triggers when a source's rating or review count changes.",
    "important": true,
    "detail": "A source's rating or review count changed, per country where the platform has several.",
    "sample": {
      "id": "evt_4821",
      "type": "rating.changed",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "src_4812",
          "url": "https://maps.app.goo.gl/Gjo5NDggCfPg8EWL8",
          "platform": "google_maps",
          "name": "Tour Eiffel",
          "location": "loc_87",
          "domain": "toureiffel.paris",
          "external_id": "10222232094831998944",
          "product": null,
          "address": {
            "line1": "Av. Gustave Eiffel",
            "line2": null,
            "city": "Paris",
            "postal_code": "75007",
            "country": "FR"
          },
          "status": "synced",
          "rating": {
            "score": 4.7,
            "count": 500407,
            "stars": {
              "1": 7324,
              "2": 5102,
              "3": 18447,
              "4": 71324,
              "5": 398210
            }
          },
          "last_synced_at": "2026-11-10T08:40:12Z",
          "dimensions": {
            "region": "Europe"
          },
          "created_at": "2026-02-03T14:05:51Z",
          "deleted": false
        },
        "country": "worldwide",
        "date": "2026-11-10",
        "rating": 4.7,
        "review_count": 500407,
        "previous": {
          "rating": 4.8,
          "review_count": 500102,
          "date": "2026-11-09"
        }
      }
    }
  },
  {
    "type": "invitation.sent",
    "group": "Review requests",
    "label": "Review Request Sent",
    "description": "Triggers when a review request goes out.",
    "important": true,
    "detail": "A review request was sent.",
    "sample": {
      "id": "evt_4821",
      "type": "invitation.sent",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "inv_00000000-0000-4000-8000-000000000001",
          "contact": "con_00000000-0000-4000-8000-000000000001",
          "campaign": "cmp_7",
          "channel": "email",
          "state": "clicked",
          "location": "loc_1",
          "sent_at": "2026-11-10T09:00:05Z",
          "delivered_at": "2026-11-10T09:00:07Z",
          "opened_at": "2026-11-10T09:14:22Z",
          "clicked_at": "2026-11-10T09:14:40Z",
          "reviewed_at": null,
          "failed_at": null,
          "open_count": 1,
          "click_count": 1,
          "created_at": "2026-11-10T09:00:04Z"
        },
        "channel": "email"
      }
    }
  },
  {
    "type": "invitation.clicked",
    "group": "Review requests",
    "label": "Review Request Clicked",
    "description": "Triggers when a customer opens their review request's link.",
    "important": false,
    "detail": "A customer opened the review request's link.",
    "sample": {
      "id": "evt_4821",
      "type": "invitation.clicked",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "inv_00000000-0000-4000-8000-000000000001",
          "contact": "con_00000000-0000-4000-8000-000000000001",
          "campaign": "cmp_7",
          "channel": "email",
          "state": "clicked",
          "location": "loc_1",
          "sent_at": "2026-11-10T09:00:05Z",
          "delivered_at": "2026-11-10T09:00:07Z",
          "opened_at": "2026-11-10T09:14:22Z",
          "clicked_at": "2026-11-10T09:14:40Z",
          "reviewed_at": null,
          "failed_at": null,
          "open_count": 1,
          "click_count": 1,
          "created_at": "2026-11-10T09:00:04Z"
        }
      }
    }
  },
  {
    "type": "invitation.skipped",
    "group": "Review requests",
    "label": "Review Request Not Sent",
    "description": "Triggers when a review request is not sent, with the reason (unsubscribed, no phone, already reviewed...).",
    "important": false,
    "detail": "A review request was not sent, with the reason (unsubscribed, no phone...).",
    "sample": {
      "id": "evt_4821",
      "type": "invitation.skipped",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "inv_00000000-0000-4000-8000-000000000001",
          "campaign": "cmp_12",
          "contact": {
            "id": "con_16154923-64e7-477d-95ce-0e7fa88c0664",
            "email": "maya.chen@example.com",
            "phone": "+14155550100",
            "first_name": "Maya",
            "last_name": "Chen",
            "attributes": {},
            "opted_out": {
              "email": "maya.chen@example.com",
              "sms": true
            },
            "created_at": "2026-11-01T09:00:00Z",
            "updated_at": "2026-11-01T09:00:00Z"
          },
          "location": "loc_87",
          "step": 1,
          "reason": "unsubscribed"
        },
        "reason": "unsubscribed"
      }
    }
  },
  {
    "type": "invitation.failed",
    "group": "Review requests",
    "label": "Review Request Failed",
    "description": "Triggers when a review request bounces or cannot be delivered.",
    "important": false,
    "detail": "A review request bounced or could not be delivered.",
    "sample": {
      "id": "evt_4821",
      "type": "invitation.failed",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "inv_00000000-0000-4000-8000-000000000001",
          "contact": "con_00000000-0000-4000-8000-000000000001",
          "campaign": "cmp_7",
          "channel": "email",
          "state": "failed",
          "location": "loc_1",
          "sent_at": "2026-11-10T09:00:05Z",
          "delivered_at": null,
          "opened_at": null,
          "clicked_at": null,
          "reviewed_at": null,
          "failed_at": "2026-11-10T09:00:09Z",
          "open_count": 0,
          "click_count": 0,
          "created_at": "2026-11-10T09:00:04Z"
        },
        "reason": "bounced"
      }
    }
  },
  {
    "type": "contact.reviewed",
    "group": "Review requests",
    "label": "Customer Left a Review",
    "description": "Triggers when a customer you asked leaves a review, matched to them by name.",
    "important": true,
    "detail": "A customer left a review after their review request: a review on your sources was matched to them by name.",
    "sample": {
      "id": "evt_4821",
      "type": "contact.reviewed",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "con_16154923-64e7-477d-95ce-0e7fa88c0664",
          "email": "maya.chen@example.com",
          "phone": "+14155550100",
          "first_name": "Maya",
          "last_name": "Chen",
          "attributes": {},
          "opted_out": {
            "email": "maya.chen@example.com",
            "sms": true
          },
          "created_at": "2026-11-01T09:00:00Z",
          "updated_at": "2026-11-01T09:00:00Z"
        },
        "source": "src_4812",
        "campaign": "cmp_12",
        "review": "rev_918201"
      }
    }
  },
  {
    "type": "contact.opted_out",
    "group": "Review requests",
    "label": "Contact Unsubscribed",
    "description": "Triggers when a contact unsubscribes from review requests.",
    "important": false,
    "detail": "A contact unsubscribed from review requests.",
    "sample": {
      "id": "evt_4821",
      "type": "contact.opted_out",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "con_16154923-64e7-477d-95ce-0e7fa88c0664",
          "email": "maya.chen@example.com",
          "phone": "+14155550100",
          "first_name": "Maya",
          "last_name": "Chen",
          "attributes": {},
          "opted_out": {
            "email": "maya.chen@example.com",
            "sms": true
          },
          "created_at": "2026-11-01T09:00:00Z",
          "updated_at": "2026-11-01T09:00:00Z"
        },
        "channel": "email"
      }
    }
  },
  {
    "type": "campaign.paused",
    "group": "Review requests",
    "label": "Campaign Paused",
    "description": "Triggers when a campaign pauses: by a person, an integration, or credits running out.",
    "important": false,
    "detail": "A campaign paused, by a person, an integration or credits running out.",
    "sample": {
      "id": "evt_4821",
      "type": "campaign.paused",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "cmp_7",
          "name": "Visits completed in our booking system",
          "channel": "email",
          "state": "paused",
          "segment": null,
          "review_page_url": "https://rvwz.page/m/zbX5nBqTXSQ",
          "destinations": [
            {
              "platform": "google_maps",
              "goal": "most_reviews",
              "target": null,
              "button_text": null
            }
          ],
          "send_delay_minutes": 120,
          "throttle": null,
          "messages": [
            {
              "position": 1,
              "channel": "email",
              "subject": "How was your visit?",
              "body": "Hi {{first_name}}, thanks for visiting today. Could you take a minute to tell others how it went?",
              "cta_text": "Leave a review",
              "sender": "Sofia @ Tour Eiffel",
              "reply_to": "hello@yourcompany.com",
              "delay_minutes": 120,
              "complete": true
            },
            {
              "position": 2,
              "channel": "email",
              "subject": "Re: How was your visit?",
              "body": "Hi {{first_name}}, in case you missed our last message: a minute is all it takes to tell others how your visit went.",
              "cta_text": "Leave a review",
              "sender": "Sofia @ Tour Eiffel",
              "reply_to": "hello@yourcompany.com",
              "delay_minutes": 4320,
              "complete": true
            }
          ],
          "ready": true,
          "blockers": [],
          "created_at": "2026-11-01T09:00:00Z"
        },
        "reason": "credits"
      }
    }
  },
  {
    "type": "campaign.resumed",
    "group": "Review requests",
    "label": "Campaign Resumed",
    "description": "Triggers when a paused campaign starts sending again.",
    "important": false,
    "detail": "A paused campaign started sending again.",
    "sample": {
      "id": "evt_4821",
      "type": "campaign.resumed",
      "timestamp": "2026-11-10T08:40:09Z",
      "data": {
        "object": {
          "id": "cmp_7",
          "name": "Visits completed in our booking system",
          "channel": "email",
          "state": "active",
          "segment": null,
          "review_page_url": "https://rvwz.page/m/zbX5nBqTXSQ",
          "destinations": [
            {
              "platform": "google_maps",
              "goal": "most_reviews",
              "target": null,
              "button_text": null
            }
          ],
          "send_delay_minutes": 120,
          "throttle": null,
          "messages": [
            {
              "position": 1,
              "channel": "email",
              "subject": "How was your visit?",
              "body": "Hi {{first_name}}, thanks for visiting today. Could you take a minute to tell others how it went?",
              "cta_text": "Leave a review",
              "sender": "Sofia @ Tour Eiffel",
              "reply_to": "hello@yourcompany.com",
              "delay_minutes": 120,
              "complete": true
            },
            {
              "position": 2,
              "channel": "email",
              "subject": "Re: How was your visit?",
              "body": "Hi {{first_name}}, in case you missed our last message: a minute is all it takes to tell others how your visit went.",
              "cta_text": "Leave a review",
              "sender": "Sofia @ Tour Eiffel",
              "reply_to": "hello@yourcompany.com",
              "delay_minutes": 4320,
              "complete": true
            }
          ],
          "ready": true,
          "blockers": [],
          "created_at": "2026-11-01T09:00:00Z"
        },
        "reason": "manual"
      }
    }
  }
];
