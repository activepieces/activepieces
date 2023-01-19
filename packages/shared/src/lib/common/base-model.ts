import { Type } from "@sinclair/typebox";

export interface BaseModel<T> {
  id: T;
  created: string;
  updated: string;
}

export const BaseModelSchema = {
  id: Type.String(),
  created: Type.String(),
  update: Type.String(),
}