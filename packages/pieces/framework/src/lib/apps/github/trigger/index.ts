import { Trigger } from "../../../framework/trigger/trigger"
import { githubRegisterTrigger } from "./register-trigger"

export enum GithubEventType {
  PULL_REQUEST = 'pull_request',
  STAR = 'star',
  ISSUES = 'issues'
}

export const registered = [
  {
    name: GithubEventType.PULL_REQUEST,
    displayName: "Pull Request Activity",
    description: "This event occurs when there is activity on a pull request.",
    sampleData: {}
  },
  {
    name: GithubEventType.STAR,
    displayName: "Star Activity",
    description: "This event occurs when there is activity relating to repository stars.",
    sampleData: {
      "action": "created",
      "starred_at": "2023-01-23T13:23:24Z",
      "repository": {
        "id": 573661753,
        "name": "activepieces",
        "full_name": "activepieces/activepieces",
        "owner": {
          "login": "activepieces",
          "id": 99494700,
        },
        "topics": [
          "automation",
          "low-code",
          "no-code",
          "workflows",
          "zapier"
        ],
        "visibility": "public",
        "forks": 10,
        "open_issues": 49,
        "watchers": 155,
        "default_branch": "main"
      },
      "organization": {
        "login": "activepieces",
        "id": 99494700,
        "description": "Automate your work, Open source alternative to Zapier, Tray.io, make"
      },
      "sender": {
        "login": "abuaboud",
        "id": 1812998,
        "avatar_url": "https://avatars.githubusercontent.com/u/31868364?v=4",
      }
    }
  },
  {
    name: GithubEventType.ISSUES,
    displayName: "Issues",
    description: "This event occurs when there is activity relating to an issue.",
    sampleData: {}
  }
]

export const githubTriggers: Trigger[] = registered.map((def) => githubRegisterTrigger(def))