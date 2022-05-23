import "graphql";
import { useRef } from "react";
import {
  DocumentNode,
  OperationVariables,
  QueryHookOptions,
  TypedDocumentNode,
  useQuery,
} from "@apollo/client";
import { useApolloReactiveXContext } from "../Provider";

export default function useReactiveQuery<
  TData = any,
  TVariables = OperationVariables
>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables> | undefined
) {
  // Get Schema Store
  const { queryStore } = useApolloReactiveXContext();

  // Run Query
  const apolloQuery = useQuery(query, options);

  // Track Data Changes
  const prevApolloData = useRef<TData | undefined>(undefined);
  const mobxData = useRef<TData | undefined>(undefined);

  // Copy to Reactive Schema Store
  if (apolloQuery.data && prevApolloData.current !== apolloQuery.data) {
    prevApolloData.current = apolloQuery.data;
    queryStore.writeQueryData(apolloQuery.data);
    mobxData.current = queryStore.useQueryResponse<TData>(apolloQuery.data);
  }

  // Return with Reactive Data
  return {
    ...apolloQuery,
    reactiveData: mobxData.current,
  };
}
