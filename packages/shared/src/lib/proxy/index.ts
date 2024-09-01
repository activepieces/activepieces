import { Static, Type } from "@sinclair/typebox";
import { BaseModelSchema } from "../common";

export const ProxyConfig = Type.Object({
  ...BaseModelSchema,
  defaultHeaders: Type.Record(Type.String(), Type.String()),
  baseUrl: Type.String(),
  provider: Type.String(),
  platformId: Type.String(),
})

export type ProxyConfig = Static<typeof ProxyConfig>;