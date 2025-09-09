import { createAction, Property } from "@activepieces/pieces-framework";
import { murfAuth } from "../common/auth";
import { makeRequest } from "../common/client";
import { HttpMethod } from "@activepieces/pieces-common";
import { murfCommon } from "../common/dropdown";

export const textToSpeech = createAction({
  auth: murfAuth,
  name: "text_to_speech",
  displayName: "Text to Speech",
  description: "Converts input text into speech using Murf AI.",
  props: {
    language: murfCommon.language,
    voiceId: murfCommon.voiceId,
    text: Property.LongText({
      displayName: "Text",
      description: "The text to be synthesized.",
      required: true,
    }),
    audioDuration: Property.Number({
      displayName: "Audio Duration (seconds)",
      description:
        "Specify audio length. If 0, Murf ignores this. Only for Gen2 model.",
      required: false,
    }),
    channelType: Property.StaticDropdown({
      displayName: "Channel Type",
      description: "Mono or Stereo output.",
      required: false,
      options: {
        options: [
          { label: "Mono", value: "MONO" },
          { label: "Stereo", value: "STEREO" },
        ],
      },
    }),
    encodeAsBase64: Property.Checkbox({
      displayName: "Encode as Base64",
      description:
        "Return Base64 encoded audio instead of URL (zero retention).",
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: "Audio Format",
      description: "Select audio format.",
      required: false,
      options: {
        options: [
          { label: "MP3", value: "MP3" },
          { label: "WAV", value: "WAV" },
          { label: "FLAC", value: "FLAC" },
          { label: "ALAW", value: "ALAW" },
          { label: "ULAW", value: "ULAW" },
          { label: "PCM", value: "PCM" },
          { label: "OGG", value: "OGG" },
        ],
      },
    }),
    modelVersion: Property.StaticDropdown({
      displayName: "Model Version",
      description: "Choose Gen1 or Gen2.",
      required: false,
      options: {
        options: [
          { label: "GEN1", value: "GEN1" },
          { label: "GEN2", value: "GEN2" },
        ],
      },
    }),
    multiNativeLocale: Property.ShortText({
      displayName: "Multi Native Locale",
      description:
        "Set multi-language voice (e.g., en-US, es-ES). Only for Gen2.",
      required: false,
    }),
    pitch: Property.Number({
      displayName: "Pitch",
      description: "Pitch adjustment (-50 to 50).",
      required: false,
    }),
    rate: Property.Number({
      displayName: "Rate",
      description: "Speed adjustment (-50 to 50).",
      required: false,
    }),
    style: Property.ShortText({
      displayName: "Style",
      description:
        "Voice style (e.g., 'default', 'calm', 'energetic'). Check voice details.",
      required: false,
    }),
    sampleRate: Property.Number({
      displayName: "Sample Rate",
      description: "Defaults to 44100. Allowed: 8000, 24000, 44100, 48000.",
      required: false,
    }),
    variation: Property.Number({
      displayName: "Variation",
      description:
        "Variation level (0–5). Defaults to 1. Higher = more natural pauses/pitch/speed.",
      required: false,
    }),
    wordDurationsAsOriginalText: Property.Checkbox({
      displayName: "Word Durations as Original Text",
      description:
        "If true, response word timings map to original text. (English only).",
      required: false,
    }),
    pronunciationDictionary: Property.Json({
      displayName: "Pronunciation Dictionary",
      description:
        "Custom word pronunciations.",
      required: false,
    }),
  },
  async run(context) {
    const body = {
      text: context.propsValue.text,
      voiceId: context.propsValue.voiceId,
      audioDuration: context.propsValue.audioDuration,
      channelType: context.propsValue.channelType,
      encodeAsBase64: context.propsValue.encodeAsBase64,
      format: context.propsValue.format,
      modelVersion: context.propsValue.modelVersion,
      multiNativeLocale: context.propsValue.multiNativeLocale,
      pitch: context.propsValue.pitch,
      rate: context.propsValue.rate,
      sampleRate: context.propsValue.sampleRate,
      style: context.propsValue.style,
      variation: context.propsValue.variation,
      wordDurationsAsOriginalText:
        context.propsValue.wordDurationsAsOriginalText,
      pronunciationDictionary: context.propsValue.pronunciationDictionary,
    };

    const response = await makeRequest(
      context.auth ,
      HttpMethod.POST,
      "/speech/generate",
      body
    );

    return response;
  },
});
