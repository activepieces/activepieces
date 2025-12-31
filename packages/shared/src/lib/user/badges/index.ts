import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../../common";

export const UserBadge = Type.Object({
   ...BaseModelSchema,
   name: Type.String(),
   userId: Type.String(),
   
})

export type UserBadge = Static<typeof UserBadge>