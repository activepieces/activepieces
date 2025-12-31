import { Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../../common";


export const UserBadge = Type.Object({
   ...BaseModelSchema,
   name: Type.String(),
})