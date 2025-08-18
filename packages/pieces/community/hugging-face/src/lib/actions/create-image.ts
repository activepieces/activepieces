import { createAction, Property } from '@activepieces/pieces-framework';
import { InferenceClient } from "@huggingface/inference";

export const createImage = createAction({
  name: "create_image",
  displayName: "Create Image",
  description: "Generate images from text prompts using Hugging Face diffusion models",
  props: {
    model: Property.StaticDropdown({
      displayName: "Model",
      description: "Hugging Face model ID for image generation",
      required: true,
      options: {
        disabled: false,
        options: [
          { label: "black-forest-labs/FLUX.1-dev", value: "black-forest-labs/FLUX.1-dev" },
          { label: "latent-consistency/lcm-lora-sdxl", value: "latent-consistency/lcm-lora-sdxl" },
          { label: "Kwai-Kolors/Kolors", value: "Kwai-Kolors/Kolors" },
          { label: "stabilityai/stable-diffusion-3-medium-diffusers", value: "stabilityai/stable-diffusion-3-medium-diffusers" },
        ]
      }
    }),
    prompt: Property.LongText({
      displayName: "Prompt",
      description: "Text prompt for image generation",
      required: true
    }),
    negative_prompt: Property.LongText({
      displayName: "Negative Prompt",
      description: "Things to avoid in the generated image",
      required: false
    }),
    guidance_scale: Property.Number({
      displayName: "Guidance Scale",
      description: "How closely to follow the prompt (1-20)",
      required: false,
      defaultValue: 7.5
    }),
    num_inference_steps: Property.Number({
      displayName: "Inference Steps",
      description: "Number of denoising steps",
      required: false,
      defaultValue: 50
    }),
    width: Property.Number({
      displayName: "Width",
      description: "Image width in pixels",
      required: false,
      defaultValue: 512
    }),
    height: Property.Number({
      displayName: "Height",
      description: "Image height in pixels",
      required: false,
      defaultValue: 512
    }),
    use_cache: Property.Checkbox({
      displayName: "Use Cache",
      description: "Use cached results if available",
      required: false,
      defaultValue: true
    }),
    wait_for_model: Property.Checkbox({
      displayName: "Wait for Model",
      description: "Wait for model to load if not ready",
      required: false,
      defaultValue: false
    })
  },
  async run(context) {
    const {
      model, prompt, negative_prompt, guidance_scale,
      num_inference_steps, width, height, use_cache, wait_for_model
    } = context.propsValue;
    const hf = new InferenceClient(context.auth as string);

    const apiResponse: any = await hf.textToImage({
      model,
      inputs: prompt,
      parameters: {
        negative_prompt,
        guidance_scale,
        num_inference_steps,
        width,
        height,
      },
      options: {
        use_cache: use_cache ?? true,
        wait_for_model: wait_for_model ?? false
      }
    });

    if (apiResponse instanceof Blob) {
      const imageBuffer = Buffer.from(await apiResponse.arrayBuffer());

      return {
        image: imageBuffer.toString('base64'),
        format: 'image/png',  
      }
    } else {
      throw new Error(`Hugging Face API did not return an image. Response: ${JSON.stringify(apiResponse)}`);
    }
  }
});
