import {
  FileProperty,
  PieceAuthProperty,
  ShortTextProperty,
  StaticPropsValue
} from '@activepieces/pieces-framework';
import { Document } from 'langchain/dist/document';


interface DatasourcePropertyMap {
  [name: string]: ShortTextProperty<boolean> | FileProperty<boolean>;
}

export interface DatasourceSyncContext<
  auth extends PieceAuthProperty,
  props extends DatasourcePropertyMap
> {
  auth: auth;
  propsValue: StaticPropsValue<props>;
}

class Datasource<
  auth extends PieceAuthProperty,
  props extends DatasourcePropertyMap
> {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly auth: auth | undefined,
    public readonly props: props,
    public readonly sync: (
      ctx: DatasourceSyncContext<auth, props>
    ) => Promise<Document[]>
  ) {}
}

export const createDatasource = <
  auth extends PieceAuthProperty,
  props extends DatasourcePropertyMap
>(
  request: {
    name: string;
    description: string;
    auth?: auth;
    props: props;
    sync: (ctx: DatasourceSyncContext<auth, props>) => Promise<Document[]>;
  }
) => {
  return new Datasource(
    request.name,
    request.description,
    request.auth,
    request.props,
    request.sync
  );
}