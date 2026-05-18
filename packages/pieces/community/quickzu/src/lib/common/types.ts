import {
  DiscountFilterType,
  DiscountMethod,
  DiscountValueType,
} from './constants';

export type ListAPIResponse<T> = {
  data: Array<T>;
  total: number;
  success: boolean;
};

export type Category = {
  status: boolean;
  index: number;
  _id: string;
  name: string;
  shop: string;
  __v: number;
};

export type CategoryInput = {
  name: string;
  status: boolean;
};

export type Product = {
  desc: string;
  value_per_unit: number;
  status: boolean;
  availability: boolean;
  enable_variants: boolean;
  stock_enabled: boolean;
  available_stock: number;
  sku: string;
  exclude_tax: boolean;
  index: number;
  _id: string;
  name: string;
  mrp: number;
  price: number;
  category: Pick<Category, '_id' | 'name'>;
  unit: string;
  meta: { nonveg: boolean };
  picture: string;
  shop: string;
  __v: number;
  picture_thumb: string;
  id: string;
};

export type ProductInput = {
  name: string;
  desc?: string;
  value_per_unit: number;
  status: boolean;
  availability: boolean;
  enable_variants: boolean;
  exclude_tax: boolean;
  mrp: number;
  price?: number;
  category: string;
  unit: string;
  meta: { nonveg: boolean };
};

export type ProductDiscountInput = {
  discount_method: DiscountMethod;
  filter_type: DiscountFilterType;
  is_enabled: boolean;
  is_visible: boolean;
  start_date: string;
  end_date: string;
  max_users_limit?: number;
  minimum_cart_value?: number;
  selectedCategories?: string[];
  selectedProducts?: string[];
  promo_code?: string;
  title: string;
  type: DiscountValueType;
  value: string;
};

export type BusinessTimingInput = {
  timing: {
    [key: string]: {
      status: boolean;
      start: string;
      end: string;
    };
  };
};
