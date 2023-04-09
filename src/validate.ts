/* eslint-disable @typescript-eslint/no-explicit-any */
import { validators } from "./validations";

type JsonType = {
    type: string;
    optional: boolean;
    union: boolean;
    literal: boolean;
    array: boolean;
    primitive: boolean;
    tags: string[][];
    children?: JsonSchema;
}

type JsonSchema = {
    [prop: string]: JsonType
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const $schema = <T>(): string => "";

const getAllRequiredKeys = (json: JsonSchema) => {
    return Object.keys(json).filter(key => !json[key].optional);
};

const validateUnion = (json: Array<JsonType>, input: any) => {
    let valid = true;
    if (json.includes(input)) {
        return valid;
    }

    for (const schema of json) {
        if (typeof schema !== "object") {
            continue;
        }

        if (validateJsonType(schema, input)) {
            return true;
        }
    }

    return false;
};

const validateArray = (json: Array<JsonType>, input: any) => {
    if (!Array.isArray(input)) {
        return false;
    }

    if (!json.length && !input.length) {
        return true;
    }

    if (json.length === 1) {
        for (const item of input) {
            if (!validateJsonType(json[0], item)) {
                return false;
            }
        }
        return true;
    }

    for (const item of input) {
        if (!validateUnion(json, item)) {
            return false;
        }
    }

    return true;
};


const validateObject = (json: JsonSchema, input: any) => {
    const requiredKeys = getAllRequiredKeys(json);

    for (const key of requiredKeys) {
        if (!input.hasOwnProperty(key)) {
            return false;
        }
    }

    for (const key of Object.keys(input)) {
        const val = input[key];
        const schema = json[key];

        if (!schema) {
            continue;
        }

        if (!validateJsonType(schema, val)) {
            return false;
        }
    }

    return true;
};

const validateJsonType = (json: JsonType, input: any) => {
    const { type, optional, union, tags, children, array, primitive, literal } = json;

    if (optional && (input === undefined || input === null)) {
        return true
    }

    if (literal) {
        if (input !== children) {
            return false;
        }
        return true;
    }

    if (primitive) {
        if (!validators[type]) {
            return true;
        }

        if (!validators[type](input, tags)) {
            return false;
        }
        return true;
    }

    if (array && children && children.length) {
        if (!validateArray(children as unknown as JsonType[], input)) {
            return false;
        }
        return true;
    }

    if (union && children && children.length) {
        if (!validateUnion(children as unknown as JsonType[], input)) {
            return false;
        }
        return true;
    }
    if (children && typeof children === "object" && !union && !primitive && !array) {
        if (!validateObject(children as JsonSchema, input)) {
            return false;
        }
        return true;
    }

    return true;
}

export const validate = <T>(json: string) => (input: T) => {
    const obj = JSON.parse(json) as JsonType;

    return validateJsonType(obj, input);
};
