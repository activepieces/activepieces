export type CreateProductParams = {
  Id?: number;
  Name?: string;
  CategoryPath?: string;
  CategoryId?: number;
  BrandName?: string;
  BrandId?: number;
  LinkId?: string;
  RefId?: string;
  IsVisible?: boolean;
  Description?: string;
  DescriptionShort?: string;
  ReleaseDate?: string;
  KeyWords?: string;
  Title?: string;
  IsActive?: boolean;
  TaxCode?: string;
  MetaTagDescription?: string;
  ShowWithoutStock?: boolean;
  Score?: number;
};

export type UpdateProductParams = Omit<CreateProductParams, 'Id'> & {
  DepartmentId: number;
};

export type GetProductByIdResponse = {
  Id: number;
  Name: string;
  DepartmentId: number;
  CategoryId: number;
  BrandId: number;
  LinkId: string;
  RefId: string;
  IsVisible: boolean;
  Description: string;
  DescriptionShort: string;
  ReleaseDate: string;
  KeyWords: string;
  Title: string;
  IsActive: boolean;
  TaxCode: string;
  MetaTagDescription: string;
  SupplierId: number | null;
  ShowWithoutStock: boolean;
  AdWordsRemarketingCode: string;
  LomadeeCampaignCode: string;
  Score: number;
};
