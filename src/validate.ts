/* eslint-disable @typescript-eslint/no-explicit-any */
import { validators } from "./validations";

type JsonSchema = {
    [prop: string]: {
        type: string;
        optional: boolean;
        union: boolean;
        literal: boolean;
        tags: string[][];
        children?: JsonSchema;
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const $schema = <T>(): string => "";

const validateUnion = (json: Array<JsonSchema | string>, input: any) => {

    if (json.includes(input)) {
        return true;
    }

    for (const schema of json) {
        if (typeof schema !== "object") {
            continue;
        }

        if (validate(schema)(input)) {
            return true;
        }
    }

    return false;
};

export const validate = <T>(json: string | JsonSchema) => (input: T) => {
    const obj = typeof json === "string" ? JSON.parse(json) as JsonSchema : json;

    for (const key of Object.keys(obj)) {
        const { type, optional, union, tags, children } = obj[key];
        const val = (input as any)[key];
        if (optional && val === undefined) {
            continue;
        }

        if (children && !union) {
            if (!validate(children)(val)) {
                return false;
            }
            continue;
        }

        if (union && children) {
            if (!validateUnion(children as unknown as JsonSchema[], val)) {
                return false;
            }
            continue;
        }

        if (!validators[type](val, tags)) {
            return false;
        }
    }

    return true;
};
