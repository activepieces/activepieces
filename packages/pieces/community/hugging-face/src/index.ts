
    import { createPiece } from "@activepieces/pieces-framework";
    import { huggingFaceAuth } from "./lib/auth";
    import { documentQuestionAnswering } from "./lib/actions/document-question-answering";
    import { languageTranslation } from "./lib/actions/language-translation";
    import { textClassification } from "./lib/actions/text-classification";
    import { textSummarization } from "./lib/actions/text-summarization";
    import { chatCompletion } from "./lib/actions/chat-completion";
    import { createImage } from "./lib/actions/create-image";
    import { objectDetection } from "./lib/actions/object-detection";
    import { imageClassification } from "./lib/actions/image-classification";

    export const huggingFace = createPiece({
      displayName: "Hugging Face",
      auth: huggingFaceAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/hugging-face.png",
      authors: [],
      actions: [
        documentQuestionAnswering,
        languageTranslation,
        textClassification,
        textSummarization,
        chatCompletion,
        createImage,
        objectDetection,
        imageClassification,
      ],
      triggers: [],
    });
    