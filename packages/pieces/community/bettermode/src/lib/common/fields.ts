export const MEMBER_FIELDS = `id
name
email
username
tagline
status
url
createdAt
role { id name }`;

export const SPACE_FIELDS = `id
name
slug
url
description
type
private
hidden
membersCount
postsCount
createdAt`;

export const POST_FIELDS = `id
title
slug
url
status
spaceId
space { name }
postTypeId
postType { name }
ownerId
owner { member { name } }
repliedToId
textContent
shortContent
fields { key value }
tags { id title }
repliesCount
reactionsCount
locked
isHidden
createdAt
updatedAt
publishedAt`;

export const POST_TYPE_FIELDS = `id
name
pluralName
slug
context
archived`;

export const TAG_FIELDS = `id
title
slug
description`;

export const BADGE_FIELDS = `id
name
shortDescription
type
active`;

export const EVENT_FIELDS = `id
title
slug
url
status
spaceId
startTime
endTime
timeZone
capacity
registrationsCount
createdAt`;

export const PAGE_INFO = `pageInfo { endCursor hasNextPage }
totalCount`;
