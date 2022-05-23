import { apolloReactiveXSchemaOptions } from "./Decorators";
import { SchemaObjectValues, ServerSchemaObj } from "./Types";

const isObjectWithTypeName = (val: any) =>
  typeof val === "object" &&
  !Array.isArray(val) &&
  val.__typename &&
  typeof val.__typename === "string";

export const testSchemaObject = (val: any) => {
  if (!val) {
    return SchemaObjectValues.Falsey;
  }
  if (Array.isArray(val)) {
    if (val.length <= 0) {
      return SchemaObjectValues.EmptyArray;
    }
    for (let i = 0; i < val.length; i += 1) {
      if (!isObjectWithTypeName(val[i])) {
        return SchemaObjectValues.NonSchemaArray;
      }
    }
    return SchemaObjectValues.SchemaArray;
  }
  return isObjectWithTypeName(val)
    ? SchemaObjectValues.SchemaObject
    : SchemaObjectValues.NonSchemaValue;
};

export const minifySchemaObject = (serverData: ServerSchemaObj) => {
  const res: any = { __typename: serverData.__typename };
  Object.keys(serverData).forEach((key) => {
    const val = serverData[key];
    const test = testSchemaObject(val);
    switch (test) {
      case SchemaObjectValues.SchemaObject:
        res[key] = minifySchemaObject(val);
        break;
      case SchemaObjectValues.SchemaArray:
        res[key] = val.map((obj: any) => minifySchemaObject(obj));
        break;
      default:
        break;
    }
  });
  const domainOptions = apolloReactiveXSchemaOptions[serverData.__typename];
  const domainObj = domainOptions.objectFactory!();
  Object.assign(domainObj, serverData);
  res.id = (domainObj as any)[domainOptions.idPropName!];
  return res;
};

export const minifyQueryResponseObject = (queryData: any) => {
  const minifiedTree: any = {};
  Object.keys(queryData).forEach((key) => {
    const val = queryData[key];
    const test = testSchemaObject(val);
    switch (test) {
      case SchemaObjectValues.SchemaObject:
        minifiedTree[key] = minifySchemaObject(val);
        break;
      case SchemaObjectValues.SchemaArray:
        minifiedTree[key] = val.map((obj: any) => minifySchemaObject(obj));
        break;
      default:
        minifiedTree[key] = val;
        break;
    }
  });
  return minifiedTree;
};
