export type ApolloReactiveXMobXMode =
  | "Disabled"
  | "UseAutoObservable"
  | "UseAnnotations";

export type ApolloReactiveXDomainOptions = {
  idPropName?: string;
  mobxMode?: ApolloReactiveXMobXMode;
  objectFactory?: () => Object;
};

type ApolloReactiveXCompleteDomainOptions = {
  idPropName: string;
  mobxMode: ApolloReactiveXMobXMode;
  objectFactory: () => Object;
};

export type ApolloReactiveXSchemaOptions = {
  [typename: string]: ApolloReactiveXDomainOptions;
};

export type ApolloReactiveXCompleteSchemaOptions<T extends string> = Record<
  T,
  ApolloReactiveXCompleteDomainOptions
>;

export enum SchemaObjectValues {
  SchemaObject = "SchemaObject",
  SchemaArray = "SchemaArray",
  NonSchemaValue = "NonSchemaValue",
  NonSchemaArray = "NonSchemaArray",
  EmptyArray = "EmptyArray",
  Falsey = "Falsey",
}

export type ServerResponseObj = { [key: string]: any };

export type ServerSchemaObj = {
  __typename: string;
} & { [key: string]: any };

export type MinifiedTreeRoot = {
  [key: string]: MinifiedTreeNode | MinifiedTreeNode[];
};

export type MinifiedTreeNode = {
  __typename: string;
  id: string;
} & {
  [key: string]: MinifiedTreeNode | MinifiedTreeNode[];
};
