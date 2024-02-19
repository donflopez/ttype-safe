/* eslint-disable @typescript-eslint/no-explicit-any */
import { TagValidator, updateValidators } from "./validations";

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


export const createCustomValidate = (tags?: {
    string?: TagValidator<string>,
    number?: TagValidator<number>,
}, throwError?: boolean) => {
    const validators = updateValidators(tags);

    const optionalThrow = (message: string) => {
        if (throwError) {
            throw new Error("ValidationError: " + message);
        }
    };

    const validateUnion = (json: Array<JsonType>, input: any) => {
        const valid = true;
        if (json.includes(input)) {
            return valid;
        }
    
        for (const schema of json) {
            if (typeof schema !== "object") {
                continue;
            }
    
            if (validateJsonType(schema, input, true)) {
                return true;
            }
        }
    
        optionalThrow(`Literal type mismatch, expected one of [${json.map(s => s.children)}] but got [${input}]`);
        return false;
    };
    
    const validateArray = (json: Array<JsonType>, input: any) => {
        if (!Array.isArray(input)) {
            optionalThrow(`Expected an array and got [${typeof input}]`);
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
                optionalThrow(`Object doesn't have expected property [${key}], it has the following keys - ${Object.keys(input)}`);
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
    
    const validateJsonType = (json: JsonType, input: any, fromUnion = false) => {
        const { type, optional, union, tags, children, array, primitive, literal } = json;
    
        if (optional && (input === undefined || input === null)) {
            return true;
        }
    
        if (optional && children && children.length) {
            if (!validateJsonType(children[0], input, fromUnion)) {
                return false;
            }
    
            return true;
        }
    
        if (literal) {
            if (input !== children) {
                if (!fromUnion) {
                    optionalThrow(`Literal type mismatch, expected one of [${json.children}] but got [${input}]`);
                }
                
                return false;
            }
            return true;
        }
    
        if (primitive) {
            if (!validators[type]) {
                return true;
            }
    
            if (!validators[type](input, tags, throwError)) {
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
    };
    
    const validate = <T>(json: string) => {
        const obj = JSON.parse(json) as JsonType;

        return (input: T) => {
            return validateJsonType(obj, input);
        };
    };

    return validate;
};

export const validate = createCustomValidate();
