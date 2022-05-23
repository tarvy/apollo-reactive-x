import { action, makeObservable } from "mobx";
import { createTransformer } from "mobx-utils";
import type SchemaStore from "./Schema";
import {
  MinifiedTreeRoot,
  MinifiedTreeNode,
  ServerResponseObj,
} from "../Types";
import { minifyQueryResponseObject } from "../Utils";

export default class QueryStore<
  TSchemaStore extends SchemaStore = SchemaStore
> {
  schemaStore: TSchemaStore;

  constructor(schemaStoreInstance: TSchemaStore) {
    this.schemaStore = schemaStoreInstance;
    makeObservable(this);
  }

  @action
  writeQueryData = (obj: ServerResponseObj) => {
    Object.values(obj).forEach((val) => {
      this.schemaStore.write(val);
    });
  };

  useQueryNode = createTransformer((treeNode: MinifiedTreeNode) => {
    const res: any = this.schemaStore.useObject(
      treeNode.__typename,
      treeNode.id
    );
    Object.keys(treeNode).forEach((key) => {
      if (key !== "__typename" && key !== "id") {
        const val = treeNode[key];
        if (Array.isArray(val)) {
          // Parse Array
          res[key] = val.map((subNode) => this.useQueryNode(subNode));
        } else {
          // Parse Object
          res[key] = this.useQueryNode(val);
        }
      }
    });
    return res;
  });

  useQueryTree = createTransformer((minifiedTree: MinifiedTreeRoot) => {
    const res: any = {};
    Object.keys(minifiedTree).forEach((key) => {
      const val = minifiedTree[key];
      if (Array.isArray(val)) {
        res[key] = val.map((node) => this.useQueryNode(node));
      } else if (val) {
        res[key] = this.useQueryNode(val);
      } else {
        res[key] = val;
      }
    });
    return res;
  });

  useQueryResponse = <T = any>(gqlDataResponse: ServerResponseObj) => {
    const minifiedTree = minifyQueryResponseObject(gqlDataResponse);
    return this.useQueryTree(minifiedTree) as T;
  };
}
