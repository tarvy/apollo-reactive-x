import { ApolloReactiveXMobXMode, ApolloReactiveXSchemaOptions } from "./Types";

export const apolloReactiveXSchemaOptions: ApolloReactiveXSchemaOptions = {};

export const setApolloReactiveXID = (typename: string, idPropName: string) => {
  const currentIDPropName = apolloReactiveXSchemaOptions[typename]?.idPropName;
  if (currentIDPropName && currentIDPropName !== idPropName) {
    throw new Error(
      `ApolloReactiveX found clashing idPropName definitions for type '${typename}'. Specifically, '${currentIDPropName}' and '${idPropName}'.\nMixing @ApolloReactiveXID() annotations with Schema Options is OK, but you'll need to make sure each option for each type gets exactly one definition (no omissions or conflicting duplicates).`
    );
  }
  if (!apolloReactiveXSchemaOptions[typename]) {
    apolloReactiveXSchemaOptions[typename] = {};
  }
  apolloReactiveXSchemaOptions[typename].idPropName = idPropName;
};

export const setMobxMode = (
  typename: string,
  mobxMode: ApolloReactiveXMobXMode
) => {
  const currentMobxMode = apolloReactiveXSchemaOptions[typename]?.mobxMode;
  if (currentMobxMode && currentMobxMode !== mobxMode) {
    throw new Error(
      `ApolloReactiveX found clashing mobXMode definitions for type '${typename}'. Specifically, '${currentMobxMode}' and '${mobxMode}'.\nMixing @ApolloReactiveXID() annotations with Schema Options is OK, but you'll need to make sure each option for each type gets exactly one definition (no omissions or conflicting duplicates).`
    );
  }
  if (!apolloReactiveXSchemaOptions[typename]) {
    apolloReactiveXSchemaOptions[typename] = {};
  }
  apolloReactiveXSchemaOptions[typename].mobxMode = mobxMode;
};

export const setObjectFactory = (
  typename: string,
  objectFactory: () => Object,
  overwrite?: boolean
) => {
  const currentObjectFactory =
    apolloReactiveXSchemaOptions[typename]?.objectFactory;
  if (!currentObjectFactory || overwrite) {
    if (!apolloReactiveXSchemaOptions[typename]) {
      apolloReactiveXSchemaOptions[typename] = {};
    }
    apolloReactiveXSchemaOptions[typename].objectFactory = objectFactory;
  }
};

export const ApolloReactiveXID =
  (settings?: { typename?: string; mobxMode?: ApolloReactiveXMobXMode }) =>
  (target: any, propertyKey: string) => {
    const ObjConstructor = target?.constructor;
    const classOrTypeName = settings?.typename || ObjConstructor?.name;

    if (!classOrTypeName) {
      throw new Error(`ApolloReactiveX was unable to infer class name / typename for id property '${propertyKey}'.
      \nTry adding the 'typename' setting to your @ApolloReactiveXID() decorator. This should match the '__typename' value that comes back from Apollo.
      \nExample: @ApolloReactiveXID({ typename: "Dog" })`);
    }

    if (propertyKey) {
      setApolloReactiveXID(classOrTypeName, propertyKey);
    }

    if (settings?.mobxMode) {
      setMobxMode(classOrTypeName, settings.mobxMode);
    }

    if (ObjConstructor) {
      setObjectFactory(classOrTypeName, () => new ObjConstructor());
    }
  };
