export type CreateBrandParams = {
    Id?: number;
    Name: string;
    Text: string;
    Keywords: string;
    SiteTitle: string;
    Active: boolean;
    MenuHome: boolean;
    AdWordsRemarketingCode: string;
    LomadeeCampaignCode: string;
    Score: null;
    LinkId: string;
}

export type UpdateBrandParams = CreateBrandParams;