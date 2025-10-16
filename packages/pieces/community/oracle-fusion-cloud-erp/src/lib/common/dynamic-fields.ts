import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { BusinessObjectType } from './constants';

export const INVOICE_FIELDS = {
    InvoiceNumber: Property.ShortText({
        displayName: 'Invoice Number',
        description: 'Unique invoice number',
        required: false,
    }),
    InvoiceAmount: Property.Number({
        displayName: 'Invoice Amount',
        description: 'Total invoice amount',
        required: false,
    }),
    InvoiceCurrencyCode: Property.ShortText({
        displayName: 'Invoice Currency Code',
        description: 'Currency code',
        required: false,
    }),
    InvoiceDate: Property.ShortText({
        displayName: 'Invoice Date',
        description: 'Invoice date in ISO format',
        required: false,
    }),
    BusinessUnit: Property.ShortText({
        displayName: 'Business Unit',
        description: 'Business unit name',
        required: false,
    }),
    Supplier: Property.ShortText({
        displayName: 'Supplier',
        description: 'Supplier name',
        required: false,
    }),
    SupplierNumber: Property.ShortText({
        displayName: 'Supplier Number',
        description: 'Supplier number',
        required: false,
    }),
    SupplierSite: Property.ShortText({
        displayName: 'Supplier Site',
        description: 'Supplier site code',
        required: false,
    }),
    Description: Property.LongText({
        displayName: 'Description',
        description: 'Invoice description',
        required: false,
    }),
    InvoiceType: Property.ShortText({
        displayName: 'Invoice Type',
        description: 'Type of invoice',
        required: false,
    }),
    PaymentTerms: Property.ShortText({
        displayName: 'Payment Terms',
        description: 'Payment terms',
        required: false,
    }),
};

export const PURCHASE_ORDER_FIELDS = {
    OrderNumber: Property.ShortText({
        displayName: 'Order Number',
        description: 'Purchase order number',
        required: false,
    }),
    Supplier: Property.ShortText({
        displayName: 'Supplier',
        description: 'Supplier name',
        required: false,
    }),
    SupplierNumber: Property.ShortText({
        displayName: 'Supplier Number',
        description: 'Supplier number',
        required: false,
    }),
    SupplierSite: Property.ShortText({
        displayName: 'Supplier Site',
        description: 'Supplier site code',
        required: false,
    }),
    BuyerName: Property.ShortText({
        displayName: 'Buyer Name',
        description: 'Name of the buyer',
        required: false,
    }),
    CurrencyCode: Property.ShortText({
        displayName: 'Currency Code',
        description: 'Currency code',
        required: false,
    }),
    Description: Property.LongText({
        displayName: 'Description',
        description: 'Purchase order description',
        required: false,
    }),
    Comments: Property.LongText({
        displayName: 'Comments',
        description: 'Additional comments',
        required: false,
    }),
};

export const SUPPLIER_FIELDS = {
    SupplierName: Property.ShortText({
        displayName: 'Supplier Name',
        description: 'Name of the supplier',
        required: false,
    }),
    SupplierNumber: Property.ShortText({
        displayName: 'Supplier Number',
        description: 'Unique supplier number',
        required: false,
    }),
    TaxOrganizationType: Property.ShortText({
        displayName: 'Tax Organization Type',
        description: 'Tax organization type',
        required: false,
    }),
    SupplierType: Property.ShortText({
        displayName: 'Supplier Type',
        description: 'Type of supplier',
        required: false,
    }),
    BusinessRelationship: Property.ShortText({
        displayName: 'Business Relationship',
        description: 'Business relationship code',
        required: false,
    }),
};

export const CUSTOMER_FIELDS = {
    CustomerName: Property.ShortText({
        displayName: 'Customer Name',
        description: 'Name of the customer',
        required: false,
    }),
    CustomerNumber: Property.ShortText({
        displayName: 'Customer Number',
        description: 'Unique customer number',
        required: false,
    }),
    CustomerType: Property.ShortText({
        displayName: 'Customer Type',
        description: 'Type of customer',
        required: false,
    }),
    CustomerClassCode: Property.ShortText({
        displayName: 'Customer Class Code',
        description: 'Customer classification code',
        required: false,
    }),
};

export const PAYMENT_FIELDS = {
    PaymentNumber: Property.ShortText({
        displayName: 'Payment Number',
        description: 'Unique payment number',
        required: false,
    }),
    PaymentAmount: Property.Number({
        displayName: 'Payment Amount',
        description: 'Payment amount',
        required: false,
    }),
    PaymentCurrencyCode: Property.ShortText({
        displayName: 'Payment Currency Code',
        description: 'Currency code',
        required: false,
    }),
    PaymentDate: Property.ShortText({
        displayName: 'Payment Date',
        description: 'Payment date in ISO format',
        required: false,
    }),
    PaymentMethodCode: Property.ShortText({
        displayName: 'Payment Method Code',
        description: 'Payment method code',
        required: false,
    }),
};

export const JOURNAL_FIELDS = {
    JournalName: Property.ShortText({
        displayName: 'Journal Name',
        description: 'Name of the journal',
        required: false,
    }),
    Description: Property.LongText({
        displayName: 'Description',
        description: 'Description of the journal',
        required: false,
    }),
    LedgerName: Property.ShortText({
        displayName: 'Ledger Name',
        description: 'Name of the ledger',
        required: false,
    }),
    AccountingDate: Property.ShortText({
        displayName: 'Accounting Date',
        description: 'Accounting date in ISO format',
        required: false,
    }),
    CurrencyCode: Property.ShortText({
        displayName: 'Currency Code',
        description: 'Currency code',
        required: false,
    }),
};

export const ASSET_FIELDS = {
    AssetNumber: Property.ShortText({
        displayName: 'Asset Number',
        description: 'Unique asset number',
        required: false,
    }),
    Description: Property.LongText({
        displayName: 'Description',
        description: 'Asset description',
        required: false,
    }),
    AssetType: Property.ShortText({
        displayName: 'Asset Type',
        description: 'Type of asset',
        required: false,
    }),
    AssetCategoryName: Property.ShortText({
        displayName: 'Asset Category Name',
        description: 'Asset category',
        required: false,
    }),
    DatePlacedInService: Property.ShortText({
        displayName: 'Date Placed In Service',
        description: 'Date asset was placed in service',
        required: false,
    }),
};

export const PROJECT_FIELDS = {
    ProjectName: Property.ShortText({
        displayName: 'Project Name',
        description: 'Name of the project',
        required: false,
    }),
    ProjectNumber: Property.ShortText({
        displayName: 'Project Number',
        description: 'Unique project number',
        required: false,
    }),
    Description: Property.LongText({
        displayName: 'Description',
        description: 'Project description',
        required: false,
    }),
    ProjectStatusCode: Property.ShortText({
        displayName: 'Project Status Code',
        description: 'Status of the project',
        required: false,
    }),
    StartDate: Property.ShortText({
        displayName: 'Start Date',
        description: 'Project start date',
        required: false,
    }),
    CompletionDate: Property.ShortText({
        displayName: 'Completion Date',
        description: 'Project completion date',
        required: false,
    }),
};

export const EMPLOYEE_FIELDS = {
    PersonNumber: Property.ShortText({
        displayName: 'Person Number',
        description: 'Unique person number',
        required: false,
    }),
    FirstName: Property.ShortText({
        displayName: 'First Name',
        description: 'Employee first name',
        required: false,
    }),
    LastName: Property.ShortText({
        displayName: 'Last Name',
        description: 'Employee last name',
        required: false,
    }),
    EmailAddress: Property.ShortText({
        displayName: 'Email Address',
        description: 'Employee email address',
        required: false,
    }),
    HireDate: Property.ShortText({
        displayName: 'Hire Date',
        description: 'Employee hire date',
        required: false,
    }),
};

export const ITEM_FIELDS = {
    ItemNumber: Property.ShortText({
        displayName: 'Item Number',
        description: 'Unique item number',
        required: false,
    }),
    Description: Property.LongText({
        displayName: 'Description',
        description: 'Description of the item',
        required: false,
    }),
    PrimaryUOMCode: Property.ShortText({
        displayName: 'Primary UOM Code',
        description: 'Primary unit of measure code',
        required: false,
    }),
    ItemType: Property.ShortText({
        displayName: 'Item Type',
        description: 'Type of item',
        required: false,
    }),
};

export const COMMON_FIELDS = {
    custom_field: Property.Object({
        displayName: 'Additional Fields',
        description: 'Additional custom fields as JSON object',
        required: false,
    }),
};

export function getFieldsForObjectType(objectType: BusinessObjectType): DynamicPropsValue {
    const fieldMap: Record<BusinessObjectType, DynamicPropsValue> = {
        invoices: INVOICE_FIELDS,
        purchaseOrders: PURCHASE_ORDER_FIELDS,
        suppliers: SUPPLIER_FIELDS,
        customers: CUSTOMER_FIELDS,
        payments: PAYMENT_FIELDS,
        journals: JOURNAL_FIELDS,
        assets: ASSET_FIELDS,
        purchaseRequisitions: PURCHASE_ORDER_FIELDS,
        supplierSites: SUPPLIER_FIELDS,
        items: ITEM_FIELDS,
        itemCategories: ITEM_FIELDS,
        projects: PROJECT_FIELDS,
        projectTasks: PROJECT_FIELDS,
        projectExpenditures: PROJECT_FIELDS,
        employees: EMPLOYEE_FIELDS,
        positions: EMPLOYEE_FIELDS,
        departments: {
            DepartmentName: Property.ShortText({
                displayName: 'Department Name',
                description: 'Name of the department',
                required: false,
            }),
            DepartmentCode: Property.ShortText({
                displayName: 'Department Code',
                description: 'Department code',
                required: false,
            }),
            ...COMMON_FIELDS,
        },
    };

    return {
        ...fieldMap[objectType],
        ...COMMON_FIELDS,
    };
}
