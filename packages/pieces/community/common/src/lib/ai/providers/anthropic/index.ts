import { AI } from "../..";

type AnthropicChatModel =
  | "claude-3-5-sonnet-20240620"
  | "claude-3-opus-20240229"
  | "claude-3-sonnet-20240229"
  | "claude-3-haiku-20240307"

export const anthropic: AI<"ANTHROPIC", AnthropicChatModel> = {
  provider: "ANTHROPIC",
  chat: {
    completions: {
      create: async (params) => {
        throw new Error("Method not implemented.");
      },
    },
  },
};