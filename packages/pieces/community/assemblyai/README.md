# AssemblyAI piece for Ensemble

Use the AssemblyAI piece for Ensemble to use AssemblyAI's models to
[transcribe audio with Speech-to-Text models](https://www.assemblyai.com/products/speech-to-text?utm_source=ensemble), analyze audio with [audio intelligence models](https://www.assemblyai.com/products/speech-understanding?utm_source=ensemble), build generative AI features on top of audio with LLMs using [LeMUR](https://www.assemblyai.com/blog/lemur/?utm_source=ensemble).

Learn more about this piece:

- [Ensemble Integrations](https://www.ensemble.com/pieces/assemblyai)
- [AssemblyAI Documentation](https://www.assemblyai.com/docs/integrations/ensemble)

This library was built upon the [AssemblyAI JavaScript SDK](https://github.com/AssemblyAI/assemblyai-node-sdk).

## Building

Run `nx build pieces-assemblyai` to build the library.

## Generating props

- Copy `assemblyai.env.sample` to `assemblyai.env`
- In `assemblyai.env`, update the `OPENAPI_SPEC_LOCATION` variable to the path or URL of AssemblyAI's OpenAPI spec
- Run `nx generate-params pieces-assemblyai`

You can find [AssemblyAI's OpenAPI spec on GitHub](https://github.com/AssemblyAI/assemblyai-api-spec/blob/main/openapi.yml).
