export type CreateSkuParams = {
    Id?: number;
    ProductId: number;
    IsActive?: boolean;
    ActivateIfPossible?: boolean;
    Name: string;
    RefId?: string;
    Ean?: string;
    PackagedHeight: number;
    PackagedLength: number;
    PackagedWidth: number;
    PackagedWeightKg: number;
    Height?: null;
    Length?: null;
    Width?: null;
    WeightKg?: null;
    CubicWeight?: number;
    IsKit?: boolean;
    CreationDate?: null;
    RewardValue?: null;
    EstimatedDateArrival?: null;
    ManufacturerCode?: string;
    CommercialConditionId?: number;
    MeasurementUnit?: string;
    UnitMultiplier?: number;
    ModalType?: null;
    KitItensSellApart?: boolean;
    Videos?: string[];
}

export type UpdateSkuParams = CreateSkuParams;