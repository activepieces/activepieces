export const sampleJiraAccount = {
    "accountId": "xxx",
    "avatarUrls": {
        "48x48": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/initials/AP-4.png",
        "24x24": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/initials/AP-4.png",
        "16x16": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/initials/AP-4.png",
        "32x32": "https://avatar-management--avatars.us-west-2.prod.public.atl-paas.net/initials/AP-4.png"
    },
    "displayName": "ActivePieces",
    "active": true,
    "timeZone": "Europe/Berlin",
    "accountType": "atlassian"
}

export const sampleJiraProject = {
    "id": "10000",
    "key": "AP",
    "name": "ActivePieces",
    "projectTypeKey": "software",
    "simplified": false,
    "avatarUrls": {
        "48x48": "https://xxx.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/12345",
        "24x24": "https://xxx.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/12345?size=small",
        "16x16": "https://xxx.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/12345?size=xsmall",
        "32x32": "https://xxx.atlassian.net/rest/api/2/universal_avatar/view/type/project/avatar/12345?size=medium"
    }
}

export const sampleJiraIssue = {
    "id": "12345",
    "key": "AP-123",
    "fields": {
        "fixVersions": [],
        "resolution": null,
        "lastViewed": null,
        "priority": {
            "self": "https://xxx.atlassian.net/rest/api/2/priority/3",
            "iconUrl": "https://xxx.atlassian.net/images/icons/priorities/medium.svg",
            "name": "Medium",
            "id": "3"
        },
        "labels": [],
        "aggregatetimeoriginalestimate": null,
        "timeestimate": null,
        "versions": [],
        "issuelinks": [],
        "assignee": null,
        "status": {
            "description": "",
            "iconUrl": "https://xxx.atlassian.net/",
            "name": "Backlog",
            "id": "10000",
            "statusCategory": {
                "self": "https://xxx.atlassian.net/rest/api/2/statuscategory/2",
                "id": 2,
                "key": "new",
                "colorName": "blue-gray",
                "name": "New"
            }
        },
        "components": [],
        "aggregatetimeestimate": null,
        "creator": sampleJiraAccount,
        "subtasks": [],
        "reporter": sampleJiraAccount,
        "aggregateprogress": {
            "progress": 0,
            "total": 0
        },
        "progress": {
            "progress": 0,
            "total": 0
        },
        "votes": {
            "self": "https://xxx.atlassian.net/rest/api/2/issue/AP-123/votes",
            "votes": 0,
            "hasVoted": false
        },
        "issuetype": {
            "id": "10001",
            "description": "Functionality or a feature expressed as a user goal.",
            "iconUrl": "https://xxx.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/12345?size=medium",
            "name": "Story",
            "subtask": false,
            "avatarId": 12345,
            "hierarchyLevel": 0
        },
        "timespent": null,
        "project": sampleJiraProject,
        "aggregatetimespent": null,
        "resolutiondate": null,
        "workratio": -1,
        "issuerestriction": {
            "issuerestrictions": {},
            "shouldDisplay": false
        },
        "watches": {
            "self": "https://xxx.atlassian.net/rest/api/2/issue/AP-123/watchers",
            "watchCount": 0,
            "isWatching": true
        },
        "created": "2023-05-28T11:58:13.349+0200",
        "updated": "2023-05-28T11:58:13.349+0200",
        "timeoriginalestimate": null,
        "description": null,
        "timetracking": {},
        "security": null,
        "attachment": [],
        "summary": "Example",
        "duedate": null
    }
}

export const sampleJiraIssueCreatedWebhook = {
    "issue": sampleJiraIssue,
    "issue_event_type_name": "issue_created",
    "changelog": {
        "id": "12345",
        "items": [
            {
                "field": "priority",
                "fieldtype": "jira",
                "fieldId": "priority",
                "from": null,
                "fromString": null,
                "to": "3",
                "toString": "Medium"
            },
            {
                "field": "reporter",
                "fieldtype": "jira",
                "fieldId": "reporter",
                "from": null,
                "fromString": null,
                "to": "xxx",
                "toString": "ActivePieces",
                "tmpFromAccountId": null,
                "tmpToAccountId": "xxx"
            },
            {
                "field": "Status",
                "fieldtype": "jira",
                "fieldId": "status",
                "from": null,
                "fromString": null,
                "to": "10000",
                "toString": "Backlog"
            },
            {
                "field": "summary",
                "fieldtype": "jira",
                "fieldId": "summary",
                "from": null,
                "fromString": null,
                "to": null,
                "toString": "Example"
            }
        ]
    },
    "webhookEvent": "jira:issue_created",
    "user": sampleJiraAccount,
    "matchedWebhookIds": [ 1 ],
    "timestamp": 1685267893503
}