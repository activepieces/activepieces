
import { Static, Type } from '@sinclair/typebox';

export enum DataSourceType {
  PDF = 'PDF',
}

export const DataSource = Type.Object({
  displayName: Type.String(),
  id: Type.String(),
  size: Type.Number(),
  type: Type.Literal(DataSourceType.PDF),
});

export type DataSource = Static<typeof DataSource>;

export const CreateDataSourceRequest = Type.Object({
  displayName: Type.String(),
  type: Type.Literal(DataSourceType.PDF),
  settings: Type.Object({
    fileBase64: Type.String(),
  }),
});

export type CreateDataSourceRequest = Static<typeof CreateDataSourceRequest>;

export const DeleteDataSourceRequest = Type.Object({
  id: Type.String()
});

export type DeleteDataSourceRequest = Static<typeof DeleteDataSourceRequest>;
