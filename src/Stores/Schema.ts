import { action, computed, makeObservable, observable } from "mobx";
import DomainStore from "./Domain";
import {
  SchemaObjectValues,
  ServerSchemaObj,
  ApolloReactiveXSchemaOptions,
} from "../Types";
import { testSchemaObject } from "../Utils";

type UntypedDomainStores = {
  [typename: string]: DomainStore<any> | undefined;
};

export default class SchemaStore<TDomainStores = UntypedDomainStores> {
  @observable.shallow
  domainStores!: UntypedDomainStores;

  @computed
  get typedDomainStores() {
    return this.domainStores as unknown as TDomainStores;
  }

  constructor(schemaOptions: ApolloReactiveXSchemaOptions) {
    const domainStores: any = {};
    Object.keys(schemaOptions).forEach((typename) => {
      const domainOptions = schemaOptions[typename];
      domainStores[typename] = new DomainStore(typename, domainOptions);
    });
    this.domainStores = domainStores as UntypedDomainStores;
    makeObservable(this);
  }

  useDomainStore = <T extends Object>(typename: string) => {
    if (!this.domainStores[typename]) {
      throw new Error(
        `ApolloReactiveX could not find a registered class for type: '${typename}'.\nMake sure you've decorated the id field for this type's class with the @ApolloReactiveXID() annotation and that the class file is imported *before* ApolloReactiveXProvider.\nIf you'd prefer not to use annotations, you can alternatively add a type options definition to your Schema Options.`
      );
    }
    return this.domainStores[typename] as DomainStore<T>;
  };

  useObject = <T extends Object>(typename: string, id: string) =>
    this.useDomainStore<T>(typename).useObject(id);

  useObjects = <T extends Object>(typename: string, ids?: string[]) =>
    this.useDomainStore<T>(typename).useObjects(ids);

  useObjectsDictionary = <T extends Object>(typename: string, ids?: string[]) =>
    this.useDomainStore<T>(typename).useObjectsDictionary(ids);

  @action
  writeObject = (serverData: ServerSchemaObj) => {
    this.useDomainStore(serverData.__typename).writeObject(serverData);
  };

  @action
  write = (serverData: ServerSchemaObj | ServerSchemaObj[]) => {
    const res = testSchemaObject(serverData);
    if (res === SchemaObjectValues.SchemaObject) {
      this.writeObject(serverData as ServerSchemaObj);
      Object.values(serverData).forEach((serverDataSub) => {
        this.write(serverDataSub);
      });
    } else if (res === SchemaObjectValues.SchemaArray) {
      (serverData as unknown as ServerSchemaObj[]).forEach((element) => {
        this.writeObject(element);
        Object.values(element).forEach((serverDataSub) => {
          this.write(serverDataSub);
        });
      });
    }
  };
}
