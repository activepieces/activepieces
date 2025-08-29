# Mailchimp Piece - Sample Usage Examples

This document provides sample input/output examples for all the new triggers, actions, and search functions implemented in the Mailchimp piece.

## New Triggers

### 1. New Campaign Trigger

**Sample Input:**
```json
{
  "list_id": "a6b5da1054"
}
```

**Sample Output:**
```json
{
  "type": "campaign",
  "fired_at": "2009-03-26 21:35:57",
  "data": {
    "id": "42694e9e57",
    "subject": "Newsletter Campaign",
    "list_id": "a6b5da1054",
    "status": "sent",
    "send_time": "2009-03-26 21:35:57"
  }
}
```

### 2. Link Clicked Trigger

**Sample Input:**
```json
{
  "campaign_id": "42694e9e57"
}
```

**Sample Output:**
```json
[
  {
    "id": "click123",
    "campaign_id": "42694e9e57",
    "list_id": "a6b5da1054",
    "email_id": "subscriber123",
    "email_address": "user@example.com",
    "url": "https://example.com/link",
    "timestamp": "2009-03-26T21:35:57+00:00",
    "ip": "192.168.1.1"
  }
]
```

### 3. Email Opened Trigger

**Sample Input:**
```json
{
  "campaign_id": "42694e9e57"
}
```

**Sample Output:**
```json
[
  {
    "id": "open123",
    "campaign_id": "42694e9e57",
    "list_id": "a6b5da1054",
    "email_id": "subscriber123",
    "email_address": "user@example.com",
    "timestamp": "2009-03-26T21:35:57+00:00",
    "ip": "192.168.1.1"
  }
]
```

### 4. New Customer Trigger

**Sample Input:**
```json
{
  "store_id": "store123"
}
```

**Sample Output:**
```json
[
  {
    "id": "customer123",
    "email_address": "customer@example.com",
    "opt_in_status": true,
    "company": "Example Company",
    "first_name": "John",
    "last_name": "Doe",
    "orders_count": 0,
    "total_spent": 0,
    "address": {
      "address1": "123 Main St",
      "city": "Anytown",
      "province": "State",
      "postal_code": "12345",
      "country": "US"
    },
    "created_at": "2009-03-26T21:35:57+00:00",
    "updated_at": "2009-03-26T21:35:57+00:00"
  }
]
```

### 5. New Order Trigger

**Sample Input:**
```json
{
  "store_id": "store123"
}
```

**Sample Output:**
```json
[
  {
    "id": "order123",
    "customer": {
      "id": "customer123",
      "email_address": "customer@example.com",
      "opt_in_status": true,
      "first_name": "John",
      "last_name": "Doe"
    },
    "campaign_id": "42694e9e57",
    "landing_site": "https://example.com",
    "financial_status": "paid",
    "fulfillment_status": "shipped",
    "currency_code": "USD",
    "order_total": 100.00,
    "order_url": "https://example.com/orders/123",
    "discount_total": 0,
    "tax_total": 8.25,
    "shipping_total": 5.00,
    "tracking_code": "prec",
    "processed_at_foreign": "2009-03-26T21:35:57+00:00",
    "cancelled_at_foreign": null,
    "updated_at_foreign": "2009-03-26T21:35:57+00:00"
  }
]
```

### 6. New Segment Tag Subscriber Trigger

**Sample Input:**
```json
{
  "list_id": "a6b5da1054",
  "tag_name": "VIP"
}
```

**Sample Output:**
```json
[
  {
    "id": "subscriber123",
    "email_address": "user@example.com",
    "unique_email_id": "unique123",
    "web_id": 123456,
    "email_type": "html",
    "status": "subscribed",
    "merge_fields": {
      "FNAME": "John",
      "LNAME": "Doe",
      "EMAIL": "user@example.com"
    },
    "interests": {},
    "stats": {
      "avg_open_rate": 0.25,
      "avg_click_rate": 0.05
    },
    "ip_signup": "192.168.1.1",
    "timestamp_signup": "2009-03-26T21:35:57+00:00",
    "ip_opt": "192.168.1.1",
    "timestamp_opt": "2009-03-26T21:35:57+00:00",
    "member_rating": 3,
    "last_changed": "2009-03-26T21:35:57+00:00",
    "language": "en",
    "vip": false,
    "email_client": "Gmail",
    "location": {
      "latitude": 0,
      "longitude": 0,
      "gmtoff": 0,
      "dstoff": 0,
      "country_code": "US",
      "timezone": "America/New_York"
    },
    "tags": [
      {
        "id": 123,
        "name": "VIP"
      }
    ]
  }
]
```

### 7. New or Updated Subscriber Trigger

**Sample Input:**
```json
{
  "list_id": "a6b5da1054"
}
```

**Sample Output:**
```json
{
  "type": "profile",
  "fired_at": "2009-03-26 21:35:57",
  "data": {
    "id": "8a25ff1d98",
    "list_id": "a6b5da1054",
    "email": "api@mailchimp.com",
    "email_type": "html",
    "merges": {
      "EMAIL": "api@mailchimp.com",
      "FNAME": "Mailchimp",
      "LNAME": "API",
      "INTERESTS": "Group1,Group2"
    }
  }
}
```

## New Actions

### 1. Create Campaign

**Sample Input:**
```json
{
  "type": "regular",
  "list_id": "a6b5da1054",
  "subject_line": "Welcome to Our Newsletter",
  "title": "Welcome Campaign",
  "from_name": "Your Company",
  "reply_to": "noreply@yourcompany.com",
  "html_content": "<h1>Welcome!</h1><p>Thank you for subscribing to our newsletter.</p>",
  "text_content": "Welcome! Thank you for subscribing to our newsletter."
}
```

**Sample Output:**
```json
{
  "id": "campaign123",
  "web_id": 123456,
  "type": "regular",
  "create_time": "2009-03-26T21:35:57+00:00",
  "archive_url": "https://us1.campaign-archive.com/home/?u=123&id=456",
  "long_archive_url": "https://us1.campaign-archive.com/?u=123&id=456",
  "status": "save",
  "emails_sent": 0,
  "send_time": null,
  "content_type": "template",
  "needs_block_refresh": false,
  "resendable": true,
  "recipients": {
    "list_id": "a6b5da1054",
    "list_is_active": true,
    "list_name": "Test List",
    "segment_text": "",
    "recipient_count": 100
  },
  "settings": {
    "subject_line": "Welcome to Our Newsletter",
    "preview_text": "",
    "title": "Welcome Campaign",
    "from_name": "Your Company",
    "reply_to": "noreply@yourcompany.com",
    "use_conversation": false,
    "to_name": "*|FNAME|*",
    "folder_id": "",
    "authenticate": true,
    "auto_footer": false,
    "inline_css": false,
    "auto_tweet": false,
    "auto_fb_post": [],
    "fb_comments": true,
    "timewarp": false,
    "template_id": 0,
    "drag_and_drop": false
  }
}
```

### 2. Get Campaign Report

**Sample Input:**
```json
{
  "campaign_id": "campaign123"
}
```

**Sample Output:**
```json
{
  "id": "campaign123",
  "campaign_title": "Welcome Campaign",
  "type": "regular",
  "list_id": "a6b5da1054",
  "list_is_active": true,
  "list_name": "Test List",
  "subject_line": "Welcome to Our Newsletter",
  "preview_text": "",
  "emails_sent": 1000,
  "abuse_reports": 0,
  "unsubscribed": 5,
  "send_time": "2009-03-26T21:35:57+00:00",
  "bounces": {
    "hard_bounces": 2,
    "soft_bounces": 3,
    "syntax_errors": 0
  },
  "forwards": {
    "forwards_count": 10,
    "forwards_opens": 8
  },
  "opens": {
    "opens_total": 250,
    "unique_opens": 200,
    "open_rate": 0.2,
    "last_open": "2009-03-26T21:45:57+00:00"
  },
  "clicks": {
    "clicks_total": 50,
    "unique_clicks": 40,
    "unique_subscriber_clicks": 35,
    "click_rate": 0.04,
    "last_click": "2009-03-26T21:50:57+00:00"
  },
  "facebook_likes": {
    "recipient_likes": 15,
    "unique_likes": 12,
    "facebook_likes": 8
  },
  "industry_stats": {
    "type": "Marketing and Advertising",
    "open_rate": 0.18,
    "click_rate": 0.025,
    "bounce_rate": 0.008,
    "unopen_rate": 0.82,
    "unsub_rate": 0.001,
    "abuse_rate": 0.0001
  },
  "list_stats": {
    "sub_rate": 0.5,
    "unsub_rate": 0.02,
    "open_rate": 0.22,
    "click_rate": 0.045
  },
  "timewarp": [],
  "timeseries": []
}
```

### 3. Create Audience

**Sample Input:**
```json
{
  "name": "Newsletter Subscribers",
  "contact_company": "Your Company Inc.",
  "contact_address1": "123 Business St",
  "contact_city": "Business City",
  "contact_state": "BC",
  "contact_zip": "12345",
  "contact_country": "US",
  "permission_reminder": "You subscribed to our newsletter on our website.",
  "campaign_defaults_from_name": "Your Company",
  "campaign_defaults_from_email": "newsletter@yourcompany.com",
  "campaign_defaults_subject": "Newsletter from Your Company",
  "campaign_defaults_language": "en",
  "email_type_option": true
}
```

**Sample Output:**
```json
{
  "id": "list123",
  "web_id": 123456,
  "name": "Newsletter Subscribers",
  "contact": {
    "company": "Your Company Inc.",
    "address1": "123 Business St",
    "address2": "",
    "city": "Business City",
    "state": "BC",
    "zip": "12345",
    "country": "US",
    "phone": ""
  },
  "permission_reminder": "You subscribed to our newsletter on our website.",
  "use_archive_bar": true,
  "campaign_defaults": {
    "from_name": "Your Company",
    "from_email": "newsletter@yourcompany.com",
    "subject": "Newsletter from Your Company",
    "language": "en"
  },
  "notify_on_subscribe": "",
  "notify_on_unsubscribe": "",
  "date_created": "2009-03-26T21:35:57+00:00",
  "list_rating": 0,
  "email_type_option": true,
  "subscribe_url_short": "https://eepurl.com/abc123",
  "subscribe_url_long": "https://yourcompany.us1.list-manage.com/subscribe?u=123&id=456",
  "beamer_address": "us1-abc123@inbound.mailchimp.com",
  "visibility": "pub",
  "double_optin": false,
  "has_welcome": false,
  "marketing_permissions": false,
  "modules": [],
  "stats": {
    "member_count": 0,
    "unsubscribe_count": 0,
    "cleaned_count": 0,
    "member_count_since_send": 0,
    "unsubscribe_count_since_send": 0,
    "cleaned_count_since_send": 0,
    "campaign_count": 0,
    "campaign_last_sent": "",
    "merge_field_count": 2,
    "avg_sub_rate": 0,
    "avg_unsub_rate": 0,
    "target_sub_rate": 0,
    "open_rate": 0,
    "click_rate": 0,
    "last_sub_date": "",
    "last_unsub_date": ""
  }
}
```

### 4. Add or Update Subscriber

**Sample Input:**
```json
{
  "list_id": "a6b5da1054",
  "email": "john.doe@example.com",
  "status": "subscribed",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "address": {
    "addr1": "123 Main St",
    "city": "Anytown",
    "state": "ST",
    "zip": "12345",
    "country": "US"
  },
  "tags": ["VIP", "Newsletter"]
}
```

**Sample Output:**
```json
{
  "id": "subscriber123",
  "email_address": "john.doe@example.com",
  "unique_email_id": "unique123",
  "web_id": 123456,
  "email_type": "html",
  "status": "subscribed",
  "merge_fields": {
    "FNAME": "John",
    "LNAME": "Doe",
    "PHONE": "+1234567890",
    "ADDRESS": {
      "addr1": "123 Main St",
      "city": "Anytown",
      "state": "ST",
      "zip": "12345",
      "country": "US"
    }
  },
  "interests": {},
  "stats": {
    "avg_open_rate": 0,
    "avg_click_rate": 0
  },
  "ip_signup": "",
  "timestamp_signup": "",
  "ip_opt": "192.168.1.1",
  "timestamp_opt": "2009-03-26T21:35:57+00:00",
  "member_rating": 2,
  "last_changed": "2009-03-26T21:35:57+00:00",
  "language": "",
  "vip": false,
  "email_client": "",
  "location": {
    "latitude": 0,
    "longitude": 0,
    "gmtoff": 0,
    "dstoff": 0,
    "country_code": "",
    "timezone": ""
  },
  "marketing_permissions": [],
  "last_note": {
    "note_id": 0,
    "created_at": "",
    "created_by": "",
    "note": ""
  },
  "source": "API - Generic",
  "tags_count": 2,
  "tags": [
    {
      "id": 123,
      "name": "VIP"
    },
    {
      "id": 124,
      "name": "Newsletter"
    }
  ],
  "list_id": "a6b5da1054"
}
```

### 5. Archive Subscriber

**Sample Input:**
```json
{
  "list_id": "a6b5da1054",
  "email": "john.doe@example.com"
}
```

**Sample Output:**
```json
{
  "id": "subscriber123",
  "email_address": "john.doe@example.com",
  "unique_email_id": "unique123",
  "web_id": 123456,
  "email_type": "html",
  "status": "archived",
  "merge_fields": {
    "FNAME": "John",
    "LNAME": "Doe"
  },
  "interests": {},
  "stats": {
    "avg_open_rate": 0.25,
    "avg_click_rate": 0.05
  },
  "ip_signup": "",
  "timestamp_signup": "",
  "ip_opt": "192.168.1.1",
  "timestamp_opt": "2009-03-26T21:35:57+00:00",
  "member_rating": 3,
  "last_changed": "2009-03-26T21:40:57+00:00",
  "language": "",
  "vip": false,
  "email_client": "",
  "location": {
    "latitude": 0,
    "longitude": 0,
    "gmtoff": 0,
    "dstoff": 0,
    "country_code": "",
    "timezone": ""
  },
  "marketing_permissions": [],
  "last_note": {
    "note_id": 0,
    "created_at": "",
    "created_by": "",
    "note": ""
  },
  "source": "API - Generic",
  "tags_count": 0,
  "tags": [],
  "list_id": "a6b5da1054"
}
```

## Search Actions

### 1. Find Campaign

**Sample Input:**
```json
{
  "search_term": "Newsletter",
  "status": "sent",
  "type": "regular",
  "count": 10
}
```

**Sample Output:**
```json
{
  "campaigns": [
    {
      "id": "campaign123",
      "web_id": 123456,
      "type": "regular",
      "create_time": "2009-03-26T21:35:57+00:00",
      "archive_url": "https://us1.campaign-archive.com/home/?u=123&id=456",
      "long_archive_url": "https://us1.campaign-archive.com/?u=123&id=456",
      "status": "sent",
      "emails_sent": 1000,
      "send_time": "2009-03-26T21:35:57+00:00",
      "content_type": "template",
      "needs_block_refresh": false,
      "resendable": false,
      "recipients": {
        "list_id": "a6b5da1054",
        "list_is_active": true,
        "list_name": "Test List",
        "segment_text": "",
        "recipient_count": 1000
      },
      "settings": {
        "subject_line": "Monthly Newsletter - March 2009",
        "preview_text": "Check out our latest updates",
        "title": "March Newsletter Campaign",
        "from_name": "Your Company",
        "reply_to": "newsletter@yourcompany.com",
        "use_conversation": false,
        "to_name": "*|FNAME|*",
        "folder_id": "",
        "authenticate": true,
        "auto_footer": false,
        "inline_css": false,
        "auto_tweet": false,
        "auto_fb_post": [],
        "fb_comments": true,
        "timewarp": false,
        "template_id": 0,
        "drag_and_drop": false
      },
      "tracking": {
        "opens": true,
        "html_clicks": true,
        "text_clicks": false,
        "goal_tracking": false,
        "ecomm360": false,
        "google_analytics": "",
        "clicktale": ""
      },
      "report_summary": {
        "opens": 250,
        "unique_opens": 200,
        "open_rate": 0.2,
        "clicks": 50,
        "subscriber_clicks": 40,
        "click_rate": 0.04,
        "ecommerce": {
          "total_orders": 5,
          "total_spent": 500.00,
          "total_revenue": 500.00
        }
      },
      "delivery_status": {
        "enabled": false
      }
    }
  ],
  "total_items": 1
}
```

### 2. Find Customer

**Sample Input:**
```json
{
  "store_id": "store123",
  "customer_id": "customer123"
}
```

**Sample Output:**
```json
{
  "id": "customer123",
  "email_address": "customer@example.com",
  "opt_in_status": true,
  "company": "Example Company",
  "first_name": "John",
  "last_name": "Doe",
  "orders_count": 5,
  "total_spent": 500.00,
  "address": {
    "address1": "123 Main St",
    "address2": "Apt 4B",
    "city": "Anytown",
    "province": "State",
    "province_code": "ST",
    "postal_code": "12345",
    "country": "United States",
    "country_code": "US"
  },
  "created_at": "2009-03-26T21:35:57+00:00",
  "updated_at": "2009-03-26T21:40:57+00:00"
}
```

### 3. Find Tag

**Sample Input:**
```json
{
  "list_id": "a6b5da1054",
  "tag_name": "VIP"
}
```

**Sample Output:**
```json
{
  "tags": [
    {
      "id": 123,
      "name": "VIP",
      "member_count": 25,
      "type": "static"
    },
    {
      "id": 124,
      "name": "VIP Customer",
      "member_count": 15,
      "type": "static"
    }
  ],
  "total_items": 2
}
```

### 4. Find Subscriber

**Sample Input:**
```json
{
  "list_id": "a6b5da1054",
  "email": "john.doe@example.com"
}
```

**Sample Output:**
```json
{
  "id": "subscriber123",
  "email_address": "john.doe@example.com",
  "unique_email_id": "unique123",
  "web_id": 123456,
  "email_type": "html",
  "status": "subscribed",
  "merge_fields": {
    "FNAME": "John",
    "LNAME": "Doe",
    "PHONE": "+1234567890"
  },
  "interests": {},
  "stats": {
    "avg_open_rate": 0.25,
    "avg_click_rate": 0.05
  },
  "ip_signup": "192.168.1.1",
  "timestamp_signup": "2009-03-26T21:30:57+00:00",
  "ip_opt": "192.168.1.1",
  "timestamp_opt": "2009-03-26T21:35:57+00:00",
  "member_rating": 3,
  "last_changed": "2009-03-26T21:35:57+00:00",
  "language": "en",
  "vip": false,
  "email_client": "Gmail",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "gmtoff": -5,
    "dstoff": -4,
    "country_code": "US",
    "timezone": "America/New_York"
  },
  "marketing_permissions": [],
  "last_note": {
    "note_id": 456,
    "created_at": "2009-03-26T21:35:57+00:00",
    "created_by": "admin",
    "note": "VIP customer - handle with care"
  },
  "source": "API - Generic",
  "tags_count": 2,
  "tags": [
    {
      "id": 123,
      "name": "VIP"
    },
    {
      "id": 124,
      "name": "Newsletter"
    }
  ],
  "list_id": "a6b5da1054"
}
```
