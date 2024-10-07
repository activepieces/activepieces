import { DynamicProp } from "@activepieces/pieces-framework";
import { AIChatCompletion, AIChatCompletionsCreateParams, AIImageCompletion, AIImageGenerateParams } from "../index";

export function authHeader(options: AuthHeaderOptions): AuthHeader {
  return {
    name: options.bearer ? 'Authorization' as const : options.name,
    mapper: options.bearer ? headerValueMappers.bearer : options.mapper ?? headerValueMappers.default,
  };
}

export type HeaderValueMapper = (value: string) => string;

export type AuthHeader = {
  name: string
  mapper: HeaderValueMapper
}

type AuthHeaderOptions =
  | { bearer: true; }
  | { bearer: false; name: string; mapper?: HeaderValueMapper; };

const headerValueMappers = {
  bearer: (value: string) => `Bearer ${value}`,
  default: (value: string) => value
};

export type ModelParameterValue = string | number | boolean;

export function model(options: {
  label: string;
  value: string;
  supported: Array<'text' | 'image' | 'function'>;
}) {
  return {
    __tag: "no-codec" as const,
    label: options.label,
    value: options.value,
    supported: options.supported,
    codec: function (codec: ImageModelCodec | ChatModelCodec) {
      return { ...this, codec: codec, __tag: codec.__tag };
    },
  };
}

export interface ImageModelCodec {
  __tag: "image-codec",
  encodeInput: (input: AIImageGenerateParams) => Promise<object>;
  decodeOutput: (output: object) => Promise<AIImageCompletion>;
  advancedOptions?: Record<string, DynamicProp>;
}
export interface ChatModelCodec {
  __tag: "chat-codec",
  encodeInput: (input: AIChatCompletionsCreateParams) => Promise<object>;
  decodeOutput: (output: object) => Promise<AIChatCompletion>;
  advancedOptions?: Record<string, DynamicProp>;
}

export function imageCodec(codec: Omit<ImageModelCodec, "__tag">): ImageModelCodec {
  return { ...codec, __tag: "image-codec" as const };
}

export function chatCodec(codec: Omit<ChatModelCodec, "__tag">): ChatModelCodec {
  return { ...codec, __tag: "chat-codec" as const };
}
