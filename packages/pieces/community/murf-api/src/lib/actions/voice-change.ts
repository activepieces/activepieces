import { createAction, PieceAuth, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { murfAuth } from "../common/auth";
import { murfCommon } from "../common/dropdown";
import { makeRequest } from "../common/client";


export const voiceChange = createAction({
  auth: murfAuth,
  name: "voice-changer-convert",
  displayName: "Voice Changer",
  description: "Convert an input audio file to a different voice using Murf Voice Changer",
  props: {
    voiceId: murfCommon.voiceId,
    fileUrl: Property.ShortText({
      displayName: "File URL",
      description: "Publicly accessible URL of the input audio file. Either provide this or upload a file.",
      required: false,
    }),
    file: Property.File({
      displayName: "Upload File",
      description: "Upload an audio file for voice conversion",
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: "Output Format",
      description: "Format of the generated audio file",
      required: false,
      options: {
        options: [
          { label: "MP3", value: "MP3" },
          { label: "WAV", value: "WAV" },
          { label: "FLAC", value: "FLAC" },
          { label: "OGG", value: "OGG" },
        ],
      },
    }),
    channelType: Property.StaticDropdown({
      displayName: "Channel Type",
      description: "Choose MONO or STEREO output",
      required: false,
      options: {
        options: [
          { label: "Mono", value: "MONO" },
          { label: "Stereo", value: "STEREO" },
        ],
      },
    }),
    pitch: Property.Number({
      displayName: "Pitch",
      description: "Pitch adjustment (-50 to 50)",
      required: false,
    }),
    rate: Property.Number({
      displayName: "Rate",
      description: "Speed adjustment (-50 to 50)",
      required: false,
    }),
    encodeOutputAsBase64: Property.Checkbox({
      displayName: "Encode Output as Base64",
      description: "Receive audio directly as Base64 instead of a file URL",
      required: false,
    }),
  },

  async run(context) {
    const formData: Record<string, any> = {
      voice_id: context.propsValue.voiceId,
    };

    if (context.propsValue.fileUrl) {
      formData["file_url"] = context.propsValue.fileUrl;
    }

    if (context.propsValue.file) {
      formData["file"] = context.propsValue.file; 
    }

    if (context.propsValue.format) {
      formData["format"] = context.propsValue.format;
    }
    if (context.propsValue.channelType) {
      formData["channel_type"] = context.propsValue.channelType;
    }
    if (context.propsValue.pitch !== undefined) {
      formData["pitch"] = context.propsValue.pitch;
    }
    if (context.propsValue.rate !== undefined) {
      formData["rate"] = context.propsValue.rate;
    }
    if (context.propsValue.encodeOutputAsBase64) {
      formData["encode_output_as_base64"] = true;
    }

    const response=await makeRequest(
      context.auth,
      HttpMethod.POST,
      "/voice-changer/convert",
      formData,
      {
        isMultipart: true,
      }
    );

    return response.body;
  },
});
