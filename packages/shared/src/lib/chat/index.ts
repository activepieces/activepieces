import { Static, Type } from "@sinclair/typebox";

export const Chat = Type.Object({
  id: Type.String(),
  messages: Type.Array(Type.Object({
    role: Type.Union([Type.Literal('user'), Type.Literal('bot')]),
    content: Type.String(),
  })),
});

export type Chat = Static<typeof Chat>;
