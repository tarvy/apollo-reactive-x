import React, { createContext, useContext, useMemo } from "react";
import { ApolloClient, ApolloProvider } from "@apollo/client";
import QueryStore from "./Stores/Query";
import SchemaStore from "./Stores/Schema";
import { ApolloReactiveXSchemaOptions } from "./Types";
import {
  apolloReactiveXSchemaOptions,
  setApolloReactiveXID,
  setMobxMode,
  setObjectFactory,
} from "./Decorators";

const defaultSchemaStore = new SchemaStore({});
const defaultQueryStore = new QueryStore(defaultSchemaStore);

const ApolloReactiveXContext = createContext<{
  queryStore: QueryStore;
}>({
  queryStore: defaultQueryStore,
});

type ApolloReactiveXProviderProps = {
  client: ApolloClient<any>;
  schemaOptions?: ApolloReactiveXSchemaOptions;
};

const ApolloReactiveXProvider: React.FC<ApolloReactiveXProviderProps> = ({
  client,
  schemaOptions,
  children,
}) => {
  const value = useMemo(() => {
    if (schemaOptions) {
      Object.keys(schemaOptions).forEach((typename) => {
        const def = schemaOptions[typename];
        if (def.idPropName) {
          setApolloReactiveXID(typename, def.idPropName);
        }
        if (def.mobxMode) {
          setMobxMode(typename, def.mobxMode);
        }
        if (def.objectFactory) {
          setObjectFactory(typename, def.objectFactory, true);
        }
      });
    }
    const schemaStore = new SchemaStore(apolloReactiveXSchemaOptions);
    const queryStore = new QueryStore(schemaStore);
    return {
      queryStore,
    };
  }, [schemaOptions]);

  return (
    <ApolloProvider client={client}>
      <ApolloReactiveXContext.Provider value={value}>
        {children}
      </ApolloReactiveXContext.Provider>
    </ApolloProvider>
  );
};

ApolloReactiveXProvider.defaultProps = {
  schemaOptions: {},
};

export const useApolloReactiveXContext = () =>
  useContext(ApolloReactiveXContext);

export default ApolloReactiveXProvider;
