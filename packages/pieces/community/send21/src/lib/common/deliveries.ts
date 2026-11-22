/** send21 does not dedupe webhook deliveries: remember the last handled X-Send21-Delivery ids. */
export const MAX_REMEMBERED_DELIVERIES = 200;

export function isHandled(handled: string[] | null | undefined, deliveryId: string): boolean {
  return (handled ?? []).includes(deliveryId);
}

export function rememberDelivery(handled: string[] | null | undefined, deliveryId: string): string[] {
  const list = (handled ?? []).filter((id) => id !== deliveryId);
  list.push(deliveryId);
  return list.slice(-MAX_REMEMBERED_DELIVERIES);
}
