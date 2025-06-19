# pieces-medullar

Library of [Activepieces](https://www.activepieces.com/) for [Medullar Solutions](https://www.medullar.com)

## Overview

`pieces-medullar` is a library designed to integrate Medullar Solutions with the Activepieces framework, enabling seamless automation and extensibility.

## Features

- **Extensibility**: Easily integrate with other services.
- **Type-Safe**: Built with TypeScript for robust type checking.
- **Community-Driven**: Contributions are welcome to enhance its capabilities.

## Contributing

We welcome contributions! Please refer to the [Contributing Guide](https://www.activepieces.com/docs/contributing/overview) for more details.

## License

This library is released under the [MIT License](https://opensource.org/licenses/MIT).

## API Documentation

### Base URL

`https://api.medullar.com`

### Authentication

All endpoints require authentication. Include a valid access token in the `Authorization` header:

`Authorization: Bearer <your_token_here>`

### Endpoints

#### Get User Details

**GET** `/auth/v1/users/me/`

Retrieve details about the currently authenticated user.

* URL: `/auth/v1/users/me/`
* Method: GET
* Auth required: Yes
* Example Response

```json
{
  "id": 360,
  "uuid": "7e282906-b487-46d3-9e43-8a4fe5b27407",
  "username": "marc@medullar.com",
  "email": "marc@medullar.com",
  "first_name": "Marc",
  "last_name": "Llopart",
  "language": "en",
  "role": "super_admin",
  "status": "active",
  "onboarding_status": "completed",
  "other_data": {},
  "salesforce_metadata": {},
  "is_active": true,
  "date_joined": "2025-03-06T13:49:50Z",
  "last_login": "2025-05-08T08:19:43.969447Z",
  "created_at": "2025-03-06T13:49:50.011260Z",
  "updated_at": "2025-04-02T16:23:57.557045Z",
  "devices": null,
  "company": {
    "id": 26567447,
    "uuid": "3d49382e-19cb-431b-90a0-dc8f617436f5",
    "name": "Medullar Solutions",
    "stripe_promotion_code": ""
  },
  "num_days_until_trial_expiration_date": -1
}
```

#### Get User Medullar Spaces

**GET** `/explorator/v1/spaces/?user={user_uuid}&limit=1000&offset=0`

Retrieve a list of Medullar spaces associated with a specific user.

* URL: `/explorator/v1/spaces/`
* Method: GET
* Query Parameters:
  * user: UUID of the user
  * limit: Number of results to return
  * offset: Pagination offset
* Auth required: Yes
* Example Response

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 496,
      "uuid": "4d6a15d0-246f-447a-b53e-5dd9101d53c6",
      "name": "Internal Strategy",
      "is_my_space": true,
      "context": "Quarterly strategy space including roadmap planning and executive updates.",
      "questions": [],
      "expiration_date": "9999-12-31T00:00:00Z",
      "created_at": "2025-05-05T09:18:28.087134Z",
      "updated_at": "2025-05-05T09:18:28.087145Z",
      "records": null,
      "users": null,
      "record_count": 0,
      "company": {
        "id": 47,
        "uuid": "3d49382e-19cb-431b-90a0-dc8f617436f5",
        "name": "Medullar Solutions",
        "created_at": "2024-02-01T14:05:20.245119Z",
        "updated_at": "2025-05-07T15:51:56.077837Z"
      },
      "role": "owner"
    }
  ]
}
```

#### Get Chats in a Space

**GET** `/explorator/v1/chats/?space={spaceId}&limit=1000&offset=0`

Get a list of chats within a given Medullar space.

* URL: `/explorator/v1/chats/`
* Method: GET
* Query Parameters:
  * space: ID of the space
  * limit, offset: Pagination controls
* Auth required: Yes
* Example response

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 676,
      "uuid": "7904e660-ed82-47f1-a8cb-635458c0c0aa",
      "name": "automated",
      "description": "",
      "created_at": "2025-05-07T08:39:35.156881Z",
      "updated_at": "2025-05-07T08:39:35.484367Z",
      "space": {
        "uuid": "1fdda622-c253-4325-bb82-95efd47051fb",
        "name": "hello"
      }
    }
  ]
}
```

#### Create a new record in a Space

**POST** `/explorator/v1/records/`

Add a new record to a Medullar space.

* URL: `/explorator/v1/records/`
* Method: POST
* Auth required: Yes
* Body Parameters (JSON):

```json
{
  "user": {
    "uuid": "7e282906-b487-46d3-9e43-8a4fe5b27407"
  },
  "spaces": [
    {
      "uuid": "1fdda622-c253-4325-bb82-95efd47051fb"
    }
  ],
  "data": {
    "content": "let's add text to a space",
    "url": ""
  },
  "source": "text",
  "company": {
    "uuid": "3d49382e-19cb-431b-90a0-dc8f617436f5"
  }
}
```

source can be `text` `url` `file` `image`

* Example response

```json
{
  "id": 2859,
  "uuid": "e50e8d79-02e8-483f-a516-3f93a9f665e9",
  "name": "let's add text to a space...",
  "source": "text",
  "data": {
    "content": "let's add text to a space",
    "url": ""
  },
  "content_type": "text",
  "action": "add_to_space",
  "hash_string": "8664fdeef5dd7b78166f72d2dada6d375a5baebeffe75",
  "status": "pending",
  "summary": "",
  "started_at": null,
  "finished_at": null,
  "processing_time": null,
  "num_retries": 0,
  "worker_task_id": "",
  "created_at": "2025-05-08T08:33:25.224377Z",
  "updated_at": "2025-05-08T08:33:25.228917Z",
  "company": {
    "id": 47,
    "uuid": "3d49382e-19cb-431b-90a0-dc8f617436f5",
    "name": "Medullar Solutions",
    "created_at": "2024-02-01T14:05:20.245119Z",
    "updated_at": "2025-05-07T15:51:56.077837Z"
  },
  "user": {
    "uuid": "7e282906-b487-46d3-9e43-8a4fe5b27407"
  }
}
```

#### Create a New Chat in a Space

**POST** `/explorator/v1/chats/`

Create a new chat thread within a Medullar space.

* URL: `/explorator/v1/chats/`
* Method: POST
* Auth required: Yes
* Body Parameters (JSON):

```json
{
  "space": {
    "uuid": "1fdda622-c253-4325-bb82-95efd47051fb"
  },
  "name": "New Chat"
}
```

* Example response

```json
{
  "id": 698,
  "uuid": "9d5eec19-1e1f-4f7a-90ae-415077a8ae63",
  "name": "New Chat",
  "description": "",
  "created_at": "2025-05-08T08:38:26.426639Z",
  "updated_at": "2025-05-08T08:38:26.426649Z",
  "space": {
    "uuid": "1fdda622-c253-4325-bb82-95efd47051fb",
    "name": "hello"
  }
}
```

#### Post a Message in a Chat

**POST** `/explorator/v1/messages/?chat={chatId}`

Post a new message to an existing chat in a Medullar space.

* URL: /explorator/v1/messages/
* Query Parameter: chat - ID of the chat
* Method: POST
* Auth required: Yes

* Body Parameters (JSON):

```json
{
  "chat": {
    "uuid": "9d5eec19-1e1f-4f7a-90ae-415077a8ae63"
  },
  "text": "@medullar new chat",
  "user_email": "marc@medullar.com",
  "user_uuid": "7e282906-b487-46d3-9e43-8a4fe5b27407",
  "is_bot": false,
  "created_at": "2025-05-08T08:38:26.504Z",
  "is_reasoning_selected": false,
  "selected_mode": "single_agent",
  "user_name": "marc"
}
```

* Example response

```
{
  "id": 2319,
  "uuid": "68fafef2-949a-409c-b7cd-21445f5a241b",
  "text": "@medullar new chat",
  "user_uuid": "7e282906-b487-46d3-9e43-8a4fe5b27407",
  "user_email": "marc@medullar.com",
  "user_first_name": "Marc",
  "user_last_name": "Llopart",
  "is_bot": false,
  "created_at": "2025-05-08T08:38:26.713567Z",
  "updated_at": "2025-05-08T08:38:26.713577Z",
  "is_reasoning_selected": false,
  "selected_mode": "single_agent",
  "source": "external_api",
  "chat": {
    "uuid": "9d5eec19-1e1f-4f7a-90ae-415077a8ae63",
    "name": "New Chat"
  }
}
```

source should be `external_api` if you want to get the response in the API call, `internal_api` will return the response in a websocket.

#### Create a New Space

**POST** `/explorator/v1/spaces/`

Create a new Medullar space.

* URL: `/explorator/v1/spaces/`
* Method: POST
* Auth required: Yes

* Body Parameters (JSON):

```json
{
  "name": "test space",
  "company": {
    "uuid": "3d49382e-19cb-431b-90a0-dc8f617436f5"
  }
}
```

* Example response

```json
{
  "id": 501,
  "uuid": "415ab840-19b8-49dc-9aa0-d13a84ac5858",
  "name": "test space",
  "is_my_space": false,
  "context": "",
  "questions": [],
  "expiration_date": "9999-12-31T00:00:00Z",
  "created_at": "2025-05-08T08:41:35.786369Z",
  "updated_at": "2025-05-08T08:41:35.786379Z",
  "records": null,
  "users": null,
  "company": {
    "id": 47,
    "uuid": "3d49382e-19cb-431b-90a0-dc8f617436f5",
    "name": "Medullar Solutions",
    "created_at": "2024-02-01T14:05:20.245119Z",
    "updated_at": "2025-05-07T15:51:56.077837Z"
  },
  "role": "owner"
}
```
