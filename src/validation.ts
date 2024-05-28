/* eslint-disable @typescript-eslint/no-explicit-any */
import { TagValidator, updateValidators } from "./validations";

type JsonType = {
    type: string;
    optional: boolean;
    union: boolean;
    intersection: boolean;
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
        console.log("VALIDATING UNION: ", json);

        const valid = true;
        if (json.includes(input)) {
            return valid;
        }

        for (const schema of json) {
            if (typeof schema !== "object") {
                continue;
            }

            if (validateJsonType(schema, input, true)) {
                console.log("it ok", schema);
                return true;
            }

            console.log("false!");
        }

        console.log("BOUTTA THROW: ", json);

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

    const validateIntersection = (json: Array<JsonType>, input: any) => {
        if (json.length < 2) {
            optionalThrow(`Intersection types must have >= 2 children, got ${json.length} children!`);
            return false;
        }

        for (const childValidation of json) {

            if (!validateJsonType(childValidation, input)) {
                console.log("intersection failed validate on schema", childValidation, " on input ", input);
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
        const { type, optional, union, intersection, tags, children, array, primitive, literal } = json;

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
                    console.log("THROW: ", json);
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
            console.log(json.type, "array");
            if (!validateArray(children as unknown as JsonType[], input)) {
                return false;
            }
            return true;
        }

        if (intersection && children && children.length) {
            console.log(json.type, "intersection");
            if (!validateIntersection(children as unknown as JsonType[], input)) {
                return false;
            }
            return true;
        }

        if (union && children && children.length) {
            console.log(json.type, "union");
            if (!validateUnion(children as unknown as JsonType[], input)) {
                return false;
            }
            return true;
        }

        if (children && typeof children === "object" && !union && !intersection && !primitive && !array) {
            console.log(json.type, "object");
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
