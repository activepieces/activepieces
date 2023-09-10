
import { Static, Type } from '@sinclair/typebox';

export const DataSource = Type.Object({
    displayName: Type.String(),
    id: Type.String(),
    pieceName: Type.String(),
    sourceName: Type.String(),
    props: Type.Record(Type.String(), Type.Unknown())
  });
  
  export type DataSource = Static<typeof DataSource>;
  
  export const CreateDataSourceRequest = Type.Object({
    displayName: Type.String(),
    pieceName: Type.String(),
    sourceName: Type.String(),
    props: Type.Record(Type.String(), Type.Unknown())
  });
  
  export type CreateDataSourceRequest = Static<typeof CreateDataSourceRequest>;
  
  export const DeleteDataSourceRequest = Type.Object({
    name: Type.String()
  });
  
  export type DeleteDataSourceRequest = Static<typeof DeleteDataSourceRequest>;
  