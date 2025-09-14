import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "../common/client";
import { SlideSpeakAuth } from "../common/auth";
import { TemplateDropdown } from "../common/dropdown";

export const generatePresentation = createAction({
  auth: SlideSpeakAuth,
  name: "generate_presentation",
  displayName: "Generate Presentation",
  description: "Generate a presentation using AI with text or uploaded documents.",
  props: {
    plain_text: Property.LongText({
      displayName: "Plain Text",
      description: "The topic or raw text to generate a presentation about.",
      required: false,
    }),
    document_uuids: Property.Array({
      displayName: "Document UUIDs",
      description: "List of previously uploaded document UUIDs.",
      required: false,
    }),
    length: Property.Number({
      displayName: "Number of Slides",
      description: "If omitted, AI chooses between 1–200 automatically.",
      required: false,
    }),
    template: TemplateDropdown,
    language: Property.StaticDropdown({
      displayName: "Language",
      required: true,
      defaultValue: "ORIGINAL",
      options: {
        disabled: false,
        options: [
          { label: "English", value: "english" },
          { label: "French", value: "french" },
          { label: "German", value: "german" },
          { label: "Italian", value: "italian" },
          { label: "Japanese", value: "japanese" },
          { label: "Polish", value: "polish" },
          { label: "Portuguese", value: "portuguese" },
          { label: "Spanish", value: "spanish" },
          { label: "Dutch", value: "dutch" },
          { label: "Latvian", value: "latvian" },
          { label: "Lithuanian", value: "lithuanian" },
          { label: "Romanian", value: "romanian" },
        ],
      },
    }),
    fetch_images: Property.Checkbox({
      displayName: "Fetch Stock Images",
      description: "Include stock images in slides. Default: true",
      defaultValue: true,
      required: false,
    }),
    use_document_images: Property.Checkbox({
      displayName: "Use Document Images",
      description: "Include images from the provided documents. Requires document_uuids. Default: true", defaultValue: true,
      required: false,
    }),
    tone: Property.StaticDropdown({
      displayName: "Tone",
      description: "Select the tone of the presentation text.",
      required: false,
      defaultValue:'default',
      options: {
        options: [
          { label: "Default", value: "default" },
          { label: "Casual", value: "casual" },
          { label: "Professional", value: "professional" },
          { label: "Funny", value: "funny" },
          { label: "Educational", value: "educational" },
          { label: "Sales Pitch", value: "sales_pitch" },
        ],
      },
    }),
    verbosity: Property.StaticDropdown({
      displayName: "Verbosity",
      description: "Select how verbose the text should be.",
      required: false,
      defaultValue:'standard',
      options: {
        options: [
          { label: "Concise", value: "concise" },
          { label: "Standard", value: "standard" },
          { label: "Text-Heavy", value: "text-heavy" },
        ],
      },
    }),
    custom_user_instructions: Property.LongText({
      displayName: "Custom Instructions",
      description: "Extra guidance not covered by other parameters.",
      required: false,
    }),
    include_cover: Property.Checkbox({
      displayName: "Include Cover Slide",
      description: "Include a cover slide. Default: true",
      required: false,
    }),
    include_table_of_contents: Property.Checkbox({
      displayName: "Include Table of Contents",
      description: "Include table of contents slides. Default: true",
      required: false,
    }),
    add_speaker_notes: Property.Checkbox({
      displayName: "Add Speaker Notes",
      description: "Add speaker notes to slides. Default: false",
      required: false,
    }),
    use_general_knowledge: Property.Checkbox({
      displayName: "Use General Knowledge",
      description: "Expand content with related knowledge. Default: false",
      required: false,
    }),
    use_wording_from_document: Property.Checkbox({
      displayName: "Use Wording From Document",
      description: "Use similar wording from documents (requires document_uuids). Default: false",
      required: false,
    }),
    use_branding_logo: Property.Checkbox({
      displayName: "Use Branding Logo",
      description: "Include configured brand logo. Default: false",
      required: false,
    }),
    use_branding_fonts: Property.Checkbox({
      displayName: "Use Branding Fonts",
      description: "Apply brand fonts. Default: false",
      required: false,
    }),
    use_branding_color: Property.Checkbox({
      displayName: "Use Branding Color",
      description: "Apply brand color. Default: false",
      required: false,
    }),
    branding_logo: Property.ShortText({
      displayName: "Branding Logo URL",
      description: "Custom logo URL to use (overrides use_branding_logo).",
      required: false,
    }),
    branding_fonts: Property.Json({
      displayName: "Branding Fonts",
      description: "Custom fonts JSON object { title: string, body: string }",
      required: false,
    }),
    branding_color: Property.ShortText({
      displayName: "Branding Color",
      description: "Hex color code (e.g. #000000). Overrides use_branding_color.",
      required: false,
    }),
    run_sync: Property.Checkbox({
      displayName: "Run Synchronously",
      description: "If true, API waits and returns file immediately. Default: false",
      required: false,
    }),
    response_format: Property.StaticDropdown({
      displayName: "Response Format",
      description: "Select output format.",
      required: false,
      options: {
        options: [
          { label: "PowerPoint (.pptx)", value: "powerpoint" },
          { label: "PDF", value: "pdf" },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, any> = {
      plain_text: propsValue.plain_text,
      document_uuids: propsValue.document_uuids,
      length: propsValue.length,
      template: propsValue.template,
      language: propsValue.language,
      fetch_images: propsValue.fetch_images,
      use_document_images: propsValue.use_document_images,
      tone: propsValue.tone,
      verbosity: propsValue.verbosity,
      custom_user_instructions: propsValue.custom_user_instructions,
      include_cover: propsValue.include_cover,
      include_table_of_contents: propsValue.include_table_of_contents,
      add_speaker_notes: propsValue.add_speaker_notes,
      use_general_knowledge: propsValue.use_general_knowledge,
      use_wording_from_document: propsValue.use_wording_from_document,
      use_branding_logo: propsValue.use_branding_logo,
      use_branding_fonts: propsValue.use_branding_fonts,
      use_branding_color: propsValue.use_branding_color,
      branding_logo: propsValue.branding_logo,
      branding_fonts: propsValue.branding_fonts,
      branding_color: propsValue.branding_color,
      run_sync: propsValue.run_sync,
      response_format: propsValue.response_format,
    };

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      "/presentation/generate",
      body
    );

    return response;
  },
});
