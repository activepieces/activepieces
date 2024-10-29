import { DynamicProp } from '@activepieces/pieces-framework';
import {
  AIChatCompletion,
  AIChatCompletionsCreateParams,
  AIImageCompletion,
  AIImageGenerateParams,
} from '../index';
import { isNil } from '@activepieces/shared';
import { ReturnType } from '@sinclair/typebox';

export function authHeader(options: AuthHeaderOptions): AuthHeader {
  return {
    name: options.bearer ? ('Authorization' as const) : options.name,
    mapper: options.bearer
      ? headerValueMappers.bearer
      : options.mapper ?? headerValueMappers.default,
  };
}

export type HeaderValueMapper = (value: string) => string;

export type AuthHeader = {
  name: string;
  mapper: HeaderValueMapper;
};

type AuthHeaderOptions =
  | { bearer: true }
  | { bearer: false; name: string; mapper?: HeaderValueMapper };

const headerValueMappers = {
  bearer: (value: string) => `Bearer ${value}`,
  default: (value: string) => value,
};

export type ModelParameterValue = string | number | boolean;

export type Model =
  | ReturnType<typeof model>
  | ReturnType<ReturnType<typeof model>['mapper']>;

export enum ModelType {
  IMAGE = 'image',
  CHAT = 'chat',
  NO_MAPPER = 'no-mapper',
}

export function model(options: {
  label: string;
  value: string;
  supported: Array<'text' | 'image' | 'function' | 'moderation'>;
}) {
  return {
    __tag: ModelType.NO_MAPPER,
    label: options.label,
    value: options.value,
    supported: options.supported,
    mapper: function (mapper: ImageModelMapper | ChatModelMapper) {
      return { ...this, mapper: mapper, __tag: mapper.__tag };
    },
  };
}

export type ModelMapper<T extends ModelType> = T extends ModelType.IMAGE
  ? ImageModelMapper
  : T extends ModelType.CHAT
  ? ChatModelMapper
  : never;

export interface ImageModelMapper {
  __tag: ModelType.IMAGE;
  encodeInput: (input: AIImageGenerateParams) => Promise<object>;
  decodeOutput: (output: object) => Promise<AIImageCompletion | null>;
  advancedOptions?: Record<string, DynamicProp>;
}
export interface ChatModelMapper {
  __tag: ModelType.CHAT;
  encodeInput: (input: AIChatCompletionsCreateParams) => Promise<object>;
  decodeOutput: (output: object) => Promise<AIChatCompletion>;
  advancedOptions?: Record<string, DynamicProp>;
}

export function imageMapper(
  mapper: Omit<ImageModelMapper, '__tag'>
): ImageModelMapper {
  return { ...mapper, __tag: ModelType.IMAGE };
}

export function chatMapper(
  mapper: Omit<ChatModelMapper, '__tag'>
): ChatModelMapper {
  return { ...mapper, __tag: ModelType.CHAT };
}

export const hasMapper = (
  m: Model
): m is Model & { mapper: ModelMapper<ModelType> } => {
  return m.__tag === ModelType.IMAGE || m.__tag === ModelType.CHAT;
};
