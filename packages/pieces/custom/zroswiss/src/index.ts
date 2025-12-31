
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { rfqApproved } from "./lib/triggers/rfq-approved";
import { getRfqById } from "./lib/actions/get-rfq-by-id";
import { createOrder } from "./lib/actions/create-order";
import { updateOrder } from "./lib/actions/update-order";
import { getOrder } from "./lib/actions/get-order";

export const zroswissAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Zroswiss API Key',
});

export const zroswiss = createPiece({
  displayName: "Zroswiss",
  auth: zroswissAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/zroswiss.png",
  authors: [],
  actions: [getRfqById, createOrder, updateOrder, getOrder],
  triggers: [rfqApproved],
});
    