export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  ACCEPTED = 'accepted',
  CANCELLED = 'cancelled',
  DONE = 'done',
}
export enum DiscountFilterType {
  PRODUCTS = 'PRODUCTS',
  CATEGORIES = 'CATEGORIES',
  ALL_PRODUCTS = 'ALL_PRODUCTS',
}

export enum DiscountValueType {
  PERCENTAGE = 'PERCENTAGE',
  FLAT = 'FLAT',
  FIXED_PRICE = 'FIXED_PRICE',
}

export enum DiscountMethod {
  ITEM_LEVEL = 'ITEM_LEVEL',
  SUB_TOTAL = 'SUB_TOTAL',
}

export enum ProductUnit {
  PIECE = 'piece',
  KILOGRAM = 'kilogram',
  GRAM = 'Gram',
  POUND = 'pound',
  LITRE = 'litre',
  MILI_LITRE = 'mili litre',
  DOZEN = 'dozen',
  FEET = 'feet',
  METER = 'meter',
  SQUARE_FEET = 'square feet',
  SQUARE_METER = 'square meter',
  SET = 'set',
  HOUR = 'hour',
  DAY = 'day',
  SERVICE = 'service',
  COMBO = 'combo',
  BOX = 'box',
  PACK = 'pack',
  BOTTLE = 'bottle',
  WHOLE = 'whole',
  SLICE = 'slice',
  BULK = 'bulk',
}
