export type CreateCategoryParams = {
  Name: string;
  FatherCategoryId: null;
  Title: string;
  Description: string;
  Keywords: string;
  IsActive: boolean;
  LomadeeCampaignCode: null;
  AdWordsRemarketingCode: null;
  ShowInStoreFront: boolean;
  ShowBrandFilter: boolean;
  ActiveStoreFrontLink: boolean;
  GlobalCategoryId: number;
  StockKeepingUnitSelectionMode: string;
  Score: null;
};

export type UpdateCategoryParams = CreateCategoryParams;
