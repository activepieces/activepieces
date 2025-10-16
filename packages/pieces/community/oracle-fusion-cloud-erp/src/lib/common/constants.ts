import { DropdownOption } from '@activepieces/pieces-framework';

export const BUSINESS_OBJECT_TYPES: DropdownOption<string>[] = [
    { label: 'Invoices', value: 'invoices' },
    { label: 'Suppliers', value: 'suppliers' },
    { label: 'Customers', value: 'customers' },
    { label: 'Payments', value: 'payments' },
    { label: 'Journals', value: 'journals' },
    { label: 'Assets', value: 'assets' },
    { label: 'Purchase Orders', value: 'purchaseOrders' },
    { label: 'Purchase Requisitions', value: 'purchaseRequisitions' },
    { label: 'Supplier Sites', value: 'supplierSites' },
    { label: 'Items', value: 'items' },
    { label: 'Item Categories', value: 'itemCategories' },
    { label: 'Projects', value: 'projects' },
    { label: 'Project Tasks', value: 'projectTasks' },
    { label: 'Project Expenditures', value: 'projectExpenditures' },
    { label: 'Employees', value: 'employees' },
    { label: 'Positions', value: 'positions' },
    { label: 'Departments', value: 'departments' },
];

export const ACTION_ENTITY_DROPDOWN_OPTIONS = BUSINESS_OBJECT_TYPES;
export const TRIGGER_ENTITY_DROPDOWN_OPTIONS = BUSINESS_OBJECT_TYPES;

export type BusinessObjectType =
    | 'invoices'
    | 'purchaseOrders'
    | 'suppliers'
    | 'customers'
    | 'payments'
    | 'journals'
    | 'assets'
    | 'purchaseRequisitions'
    | 'supplierSites'
    | 'items'
    | 'itemCategories'
    | 'projects'
    | 'projectTasks'
    | 'projectExpenditures'
    | 'employees'
    | 'positions'
    | 'departments';
