
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { PieceCategory } from "@activepieces/shared";
    import { getPageHtml } from "./lib/actions/get-page-html";
    import { scrapeWebsiteText } from "./lib/actions/scrape-website-text";
    import { askQuestion } from "./lib/actions/ask-question";
    import { extractStructuredData } from "./lib/actions/extract-structured-data";
    import { getAccountInformation } from "./lib/actions/get-account-info";

    export const webscrappingAiAuth = PieceAuth.CustomAuth({
      required: true,
      props: {
        apiKey: PieceAuth.SecretText({ displayName: 'API Key', required: true }),
      },
    });

    export const webscrappingAi = createPiece({
      displayName: "WebScraping.AI",
      description: "AI-powered web scraping: HTML, text extraction, Q&A, and structured data.",
      auth: webscrappingAiAuth,
      minimumSupportedRelease: '0.68.2',
      logoUrl: "https://cdn.activepieces.com/pieces/webscrapping-ai.png",
      categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.DEVELOPER_TOOLS],
      authors: ['sparkybug'],
      actions: [
        getPageHtml,
        scrapeWebsiteText,
        askQuestion,
        extractStructuredData,
        getAccountInformation,
      ],
      triggers: [],
    });
    