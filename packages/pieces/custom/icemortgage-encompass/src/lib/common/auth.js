"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.icemortgageEncompassAuth = void 0;
var pieces_framework_1 = require("@activepieces/pieces-framework");
exports.icemortgageEncompassAuth = pieces_framework_1.PieceAuth.CustomAuth({
    description: 'ICE Mortgage Technology Encompass API credentials',
    required: true,
    props: {
        baseUrl: pieces_framework_1.Property.ShortText({
            displayName: 'API Base URL',
            description: 'The base URL for the Encompass API (e.g., https://api.elliemae.com)',
            required: true,
        }),
        clientId: pieces_framework_1.Property.ShortText({
            displayName: 'Client ID',
            description: 'Your Encompass API Client ID',
            required: true,
        }),
        clientSecret: pieces_framework_1.Property.ShortText({
            displayName: 'Client Secret',
            description: 'Your Encompass API Client Secret',
            required: true,
        }),
        instanceId: pieces_framework_1.Property.ShortText({
            displayName: 'Instance ID',
            description: 'Your Encompass Instance ID',
            required: true,
        }),
    },
});
