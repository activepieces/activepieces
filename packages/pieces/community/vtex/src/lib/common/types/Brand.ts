export type CreateBrandParams = {
  Id?: number;
  Name: string;
  Text?: string;
  Keywords?: string;
  SiteTitle?: string;
  Active?: boolean;
  MenuHome?: boolean;
  Score?: number;
  LinkId?: string;
};

export type UpdateBrandParams = CreateBrandParams;
