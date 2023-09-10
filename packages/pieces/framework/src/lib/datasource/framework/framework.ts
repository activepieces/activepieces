
import { Document } from 'langchain/dist/document';
import { FileProperty, PieceAuthProperty, ShortTextProperty, StaticPropsValue } from '../../property';


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

export type Datasource<
  PieceAuth extends PieceAuthProperty = any,
  TriggerProps extends DatasourcePropertyMap = any,
> = IDatasource<PieceAuth, TriggerProps>

class IDatasource<
  auth extends PieceAuthProperty,
  props extends DatasourcePropertyMap
> {
  constructor(
    public readonly name: string,
    public readonly displayName: string,
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
    displayName: string;
    description: string;
    auth?: auth;
    props: props;
    sync: (ctx: DatasourceSyncContext<auth, props>) => Promise<Document[]>;
  }
) => {
  return new IDatasource(
    request.name,
    request.displayName,
    request.description,
    request.auth,
    request.props,
    request.sync
  );
}