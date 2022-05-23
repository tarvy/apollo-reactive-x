import {
  action,
  computed,
  makeAutoObservable,
  makeObservable,
  observable,
} from "mobx";
import { createTransformer } from "mobx-utils";
import {
  SchemaObjectValues,
  ServerSchemaObj,
  ApolloReactiveXDomainOptions,
} from "../Types";
import { testSchemaObject } from "../Utils";

export default class DomainStore<T extends Object> {
  @observable.shallow
  objectsDictionary: { [id: string]: T | undefined } = {};

  typename: string;

  idPropName: string;

  makeObject: () => T;

  makeMobxObservable: (obj: T) => T;

  constructor(typename: string, domainOptions: ApolloReactiveXDomainOptions) {
    this.typename = typename;
    if (!domainOptions.idPropName) {
      throw new Error(
        `ApolloReactiveX was unable to resolve idPropName for type '${typename}'. Try adding an @ApolloReactiveXID() annotation to the id field for this class, or specify idPropName for '${typename}' type in your Schema Options.\n\nNote: When using annotations, you must import the annotated model class *before* importing ApolloReactiveXProvider or the annotations won't be picked up properly.`
      );
    }
    if (!domainOptions.mobxMode) {
      throw new Error(
        `ApolloReactiveX was unable to resolve mobxMode for type '${typename}'. Try adding an @ApolloReactiveXID({ mobxMode: [Your MobX Preference] }) annotation to the id field for this class, or specify mobxMode for '${typename}' type in your Schema Options.\n\nNote: When using annotations, you must import the annotated model class *before* importing ApolloReactiveXProvider or the annotations won't be picked up properly.`
      );
    }
    if (!domainOptions.objectFactory) {
      throw new Error(
        `ApolloReactiveX was unable to resolve objectFactory for type '${typename}'. Try adding an @ApolloReactiveXID() annotation to the id field for this class, or specify objectFactory for '${typename}' type in your Schema Options.\n\nNote: When using annotations, you must import the annotated model class *before* importing ApolloReactiveXProvider or the annotations won't be picked up properly.`
      );
    }
    this.idPropName = domainOptions.idPropName;
    this.makeObject = domainOptions.objectFactory as () => T;
    switch (domainOptions.mobxMode) {
      case "Disabled":
        this.makeMobxObservable = (obj: T) => obj;
        break;
      case "UseAnnotations":
        this.makeMobxObservable = (obj: T) => makeObservable<T>(obj);
        break;
      case "UseAutoObservable":
      default:
        this.makeMobxObservable = (obj: T) => makeAutoObservable<T>(obj);
        break;
    }
    makeObservable(this);
  }

  @computed
  get objects() {
    // Values that already exist in dictionary are guarunteed to be T, not undefined
    return Object.values(this.objectsDictionary) as T[];
  }

  @computed
  get replicatedObjectsDictionary() {
    const dict: { [key: string]: T | undefined } = {};
    Object.keys(this.objectsDictionary).forEach((id) => {
      dict[id] = this.objectsDictionary[id];
    });
    return dict;
  }

  objectByIdTransformer = createTransformer(
    ({ id }: { id: string }) => this.objectsDictionary[id]
  );

  // Gives you an observable object reference, if it exists. Otherwise: undefined
  useObject = (id: string) => this.objectByIdTransformer({ id });

  objectsByIdsTransformer = createTransformer(({ ids }: { ids: string[] }) => {
    const arr: T[] = [];
    ids.forEach((id) => {
      const element = this.objectsDictionary[id];
      if (element) {
        arr.push(element);
      }
    });
    return arr;
  });

  // Gives you an array of references to all requested observables that can be found. (No ids = ALL objects in domain)
  // Maximally: Complete list of all requested objects.
  // Potentially: List of SOME of the requested objects, ommiting those that can't be found.
  // Minimally: Empty array ([]) if none can be found.
  useObjects = (ids?: string[]) => {
    if (!ids) {
      return this.objects;
    }
    return this.objectsByIdsTransformer({
      ids,
    });
  };

  objectsDictionaryByIdsTransformer = createTransformer(
    ({ ids }: { ids: string[] }) => {
      const dict: { [key: string]: T | undefined } = {};
      ids.forEach((id) => {
        const element = this.objectsDictionary[id];
        if (element) {
          dict[id] = element;
        }
      });
      return dict;
    }
  );

  // Gives you a dictionary of references to all requested observables that can be found. (No ids = ALL objects in domain)
  // Maximally: Complete dictionary of all requested objects.
  // Potentially: A dictionary of SOME of the requested objects, ommiting those that can't be found. (Key-Based lookups will be undefined for missing objects)
  // Minimally: Empty object ({}) if none can be found.
  useObjectsDictionary = (ids?: string[]) => {
    if (!ids) {
      return this.replicatedObjectsDictionary;
    }
    return this.objectsDictionaryByIdsTransformer({
      ids,
    });
  };

  @action
  writeObject = (serverData: ServerSchemaObj) => {
    // Filtered object OMITS sub-objects and sub-object arrays that should be stored in separate domain (i.e. other schema objects)
    const filteredObj: any = {};
    Object.keys(serverData).forEach((key) => {
      if (
        ![
          SchemaObjectValues.SchemaArray,
          SchemaObjectValues.SchemaObject,
        ].includes(testSchemaObject(serverData[key]))
      ) {
        filteredObj[key] = serverData[key];
      }
    });
    const domainObj = this.makeObject();
    Object.assign(domainObj, filteredObj);
    const apolloReactiveXID = (domainObj as any)[this.idPropName];
    if (!apolloReactiveXID) {
      throw new Error(
        `ApolloReactiveXID property '${
          this.idPropName
        }'could not be retrieved from target:\n${JSON.stringify(
          domainObj,
          null,
          2
        )}\nPlease note that properties annotated with @ApolloReactiveXID or specified via idPropName must have an accessible value immediately upon object creation.`
      );
    }
    const observableRef = this.objectsDictionary[apolloReactiveXID];
    if (observableRef) {
      // Observable Exists Already - Update with Filtered Data
      Object.assign(observableRef, filteredObj);
    } else {
      // No Observable Exists Yet - Create New Observable with Data
      this.makeMobxObservable(domainObj);
      this.objectsDictionary[apolloReactiveXID] = domainObj;
    }
  };
}
