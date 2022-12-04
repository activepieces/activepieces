import { DataCell } from './data-cell';

export interface DataRow {
	url?: string;
	columns: DataCell[];
}
