import { Static } from "@sinclair/typebox";

import { Type } from "@sinclair/typebox";

export const ListPlatformProjectMembersRequestQuery = Type.Object({
    projectRoleId: Type.Optional(Type.String()),
    cursor: Type.Optional(Type.String()),
    limit: Type.Optional(Type.Number()),
});

export type ListPlatformProjectMembersRequestQuery = Static<typeof ListPlatformProjectMembersRequestQuery>;