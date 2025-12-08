import { StoreScope } from "@activepieces/pieces-framework";

export async function cacheGet(context: any, key: string) {
  return await context.store.get(`cache:${key}`, StoreScope.FLOW);
}

export async function cacheSet(context: any, key: string, value: any) {
  await context.store.put(`cache:${key}`, value, StoreScope.FLOW);
}
