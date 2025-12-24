"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fiservAuth = void 0;
var pieces_framework_1 = require("@activepieces/pieces-framework");
exports.fiservAuth = pieces_framework_1.PieceAuth.CustomAuth({
    description: 'Fiserv Banking API credentials',
    required: true,
    props: {
        baseUrl: pieces_framework_1.Property.ShortText({
            displayName: 'Base URL',
            description: 'The base URL for the Fiserv API (e.g., https://api.fiservapps.com)',
            required: true,
        }),
        organizationId: pieces_framework_1.Property.ShortText({
            displayName: 'Organization ID',
            description: 'Your Fiserv organization/institution ID',
            required: true,
        }),
        apiKey: pieces_framework_1.Property.ShortText({
            displayName: 'API Key',
            description: 'Your Fiserv API key',
            required: true,
        }),
    },
});
