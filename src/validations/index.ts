import { validateBoolean } from "./boolean";
import { customNumberValidator, validateNumber } from "./number";
import { customStringValidator, validateString } from "./string";

type Validators =  { [type: string]: (value: any, tags: string[][], throwError?: boolean) => boolean };

export const validators: Validators = {
    string: validateString,
    number: validateNumber,
    boolean: validateBoolean,
};

export type TagValidator<T> = {[tag: string]: (value: T, tagInput: string) => boolean};
export const updateValidators = (newValidators?: { string?: TagValidator<string>, number?: TagValidator<number>}): Validators   => {
    return {
        ...validators,
        string: customStringValidator(newValidators?.string || {}),
        number: customNumberValidator(newValidators?.number || {})
    };
};
