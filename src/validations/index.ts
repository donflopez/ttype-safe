import { validateBoolean } from "./boolean";
import { validateNumber } from "./number";
import { validateString } from "./string";

export const validators: { [type: string]: (value: unknown, tags: string[][]) => boolean } = {
    string: validateString,
    number: validateNumber,
    boolean: validateBoolean,
};
