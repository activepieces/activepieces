import { LICENSING_URL } from './client';

function assignmentUrl({ productId, skuId, userId }: { productId: string; skuId: string; userId?: string }) {
  const base = `${LICENSING_URL}/product/${encodeURIComponent(productId)}/sku/${encodeURIComponent(skuId)}/user`;
  return userId ? `${base}/${encodeURIComponent(userId)}` : base;
}

function flattenAssignment(assignment: LicenseAssignment) {
  return {
    user_email: assignment.userId,
    product_id: assignment.productId,
    product_name: assignment.productName ?? null,
    sku_id: assignment.skuId,
    sku_name: assignment.skuName ?? null,
  };
}

export const licensingHelpers = { assignmentUrl, flattenAssignment };

export type LicenseAssignment = {
  userId: string;
  productId: string;
  productName?: string;
  skuId: string;
  skuName?: string;
};
