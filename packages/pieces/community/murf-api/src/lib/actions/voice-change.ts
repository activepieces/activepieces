import { ApFile, createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { murfAuth } from "../common/auth";
import { murfCommon } from "../common/dropdown";
import { makeRequest } from "../common/client";
import FormData from "form-data";

export const voiceChange = createAction({
  auth: murfAuth,
  name: "voice-changer-convert",
  displayName: "Voice Changer",
  description: "Convert an input audio file to a different voice using Murf Voice Changer.",
  props: {
    language: murfCommon.language,
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

  async run({ auth, propsValue }) {
    try {
      const { voiceId, file, fileUrl, format, pitch, rate, encodeOutputAsBase64 } =
        propsValue as {
          voiceId: string;
          file?: ApFile;
          fileUrl?: string;
          format?: string;
          pitch?: number;
          rate?: number;
          encodeOutputAsBase64?: boolean;
        };

      // Validation
      if (!file && !fileUrl) {
        throw new Error(" Either 'Source Audio File' or 'Source File URL' must be provided.");
      }
      if (file && fileUrl) {
        throw new Error(" Provide only one: 'Source Audio File' OR 'Source File URL', not both.");
      }

      // Build FormData
      const formData = new FormData();
      formData.append("voice_id", voiceId);

      if (fileUrl) {
        formData.append("file_url", fileUrl);
      }
      if (file) {
        try {
          const fileBuffer = Buffer.from(file.base64, "base64");
          const blob = new Blob([fileBuffer]);
          formData.append("file", blob, file.filename);
        } catch (e) {
          throw new Error("Failed to process uploaded file. Ensure it's a valid audio file.");
        }
      }

      if (format) formData.append("format", format);
      if (pitch !== undefined) formData.append("pitch", pitch.toString());
      if (rate !== undefined) formData.append("rate", rate.toString());
      if (encodeOutputAsBase64) formData.append("encode_output_as_base64", "true");

      // API request
      const response = await makeRequest(
        auth as string,
        HttpMethod.POST,
        "/voice-changer/convert",
        formData,
        true
      );

      // Handle Murf error response
      if (response?.errorMessage) {
        throw new Error(
          ` Murf API error (${response.errorCode || "unknown"}): ${response.errorMessage}`
        );
      }

      return {
        success: true,
        message: " Voice conversion successful",
        data: response,
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || "Unexpected error during voice conversion",
        details: error.response?.body || error,
      };
    }
  },
});
