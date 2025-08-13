
    import { createPiece } from '@activepieces/pieces-framework';
    import { huggingFaceAuth } from './lib/auth';
    import { chatCompletion } from "./lib/actions/chat-completion";
    import { createImage } from "./lib/actions/create-image";
    import { documentQuestionAnswering } from "./lib/actions/document-question-answering";
    import { imageClassification } from "./lib/actions/image-classification";
    import { languageTranslation } from "./lib/actions/language-translation";
    import { objectDetection } from "./lib/actions/object-detection";
    import { textClassification } from "./lib/actions/text-classification";
    import { textSummarization } from "./lib/actions/text-summarization";

    export const huggingFace = createPiece({
      displayName: "Hugging Face",
      logoUrl: "https://cdn.activepieces.com/pieces/hugging-face.png",
      auth: huggingFaceAuth,
      authors: [],
      actions: [
        chatCompletion,
        createImage,
        documentQuestionAnswering,
        imageClassification,
        languageTranslation,
        objectDetection,
        textClassification,
        textSummarization,
      ],
      triggers: [],
    });
    