/* eslint-disable @typescript-eslint/no-explicit-any */
import { Options, Schema, SchemaContext, SchemaError, Validator, ValidatorResult } from "jsonschema";
import { TagValidator, ValidatorStructure } from "./validations";
import { STRING_VALIDATOR } from "./validations/string";
import { NUMBER_VALIDATOR } from "./validations/number";
import { handleCommentTag, handleNoCommentTag, TypedTags } from "./validations/common";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const $schema = <T>(): string => "";


const parseDescriptionForTags = (fullDescription: string, structures: ValidatorStructure<any>[]): TypedTags => {
    const tags: TypedTags = [];

    // Handle all regular tags defined in the predefined or custom tags.
    for (const structure of structures) {
        for (const tag of Object.keys(structure.tags)) {
            const test = new RegExp(`@${tag}(.*)\r?\n?`);
            const tagValue = test.exec(fullDescription)?.[1]?.trim();
            tags.push([structure.name, tag, tagValue]);
        }
    }

    // Handle the special "@error { ... }" tag for providing custom error messages within a type.
    const errorTagTest = new RegExp("@error (.*)$", "s"); // the error message must be last because it supports text field, no usable delimiter
    const errorTagValue = errorTagTest.exec(fullDescription)?.[1]?.trim();
    tags.push(["json", "@error", errorTagValue]);

    return tags;
};

const addTagValidations = (jsonSchemaValidator: Validator, structures: ValidatorStructure<any>[]): Validator => {
    const validateDescriptionTags = (input: unknown, schema: Schema, options: Options, ctx: SchemaContext): string | ValidatorResult => {
        const result = new ValidatorResult(input, schema, options, ctx);

        if (!("fullDescription" in schema)) return result; // Only try to parse nodes that have schema.fullDescription
        if (typeof schema.fullDescription !== "string") {
            throw new SchemaError("All fullDescription fields must be strings!", schema);
        }

        // Some structures share tags, e.g. string's min and number's min. So for each invocation of a tag, look through
        // every structure
        const allTags = parseDescriptionForTags(schema.fullDescription, structures);
        for (const [type, tag, tagValue] of allTags) {
            if (tagValue === undefined) continue; // The description did not contain that tag

            for (const structure of structures) {
                if (type !== structure.name) continue; // number tags not applicable to string validators
                if (!(tag in structure.tags)) continue; // if this structure doesn't declare that tag
                if (!structure.is(input)) continue; // e.g. string validators do nothing on non-strings

                const tagFn = structure.tags[tag];

                if (tagValue === "") {
                    // If there is no annotation comment, like: `@alphanumeric`.
                    if (!tagFn(input, "")) {
                        return handleNoCommentTag(result, allTags, tag, input);
                    }
                } else {
                    // If there is some annotation comment, like `@oneOf strict thing` contains "strict thing"
                    if (!tagFn(input, tagValue)) {
                        return handleCommentTag(result, allTags, tag, tagValue, input);
                    }
                }
            }
        }

        return result;
    };

    jsonSchemaValidator.attributes.fullDescription = validateDescriptionTags;

    return jsonSchemaValidator;
};

export const createCustomValidate = (tags?: {
    string?: TagValidator<string>,
    number?: TagValidator<number>,
}, throwError?: boolean) => {

    const jsonSchemaValidator = addTagValidations(new Validator(), [
        { ...STRING_VALIDATOR, tags: { ...STRING_VALIDATOR.tags, ...tags?.string }},
        { ...NUMBER_VALIDATOR, tags: { ...NUMBER_VALIDATOR.tags, ...tags?.number }}
    ]);

    const validate = <T>(json: string) => {
        const schema = JSON.parse(json);

        return (input: T) => {
            const result = jsonSchemaValidator.validate(input, schema, {
                "allowUnknownAttributes": true,
                "nestedErrors": true,
                "required": true,
                "throwAll": false,
                "throwError": false,
            });

            if (result.valid) {
                return true;
            } else if (throwError) {
                const errorData = {
                    tag: "ValidationError",
                    errors: result.errors.map(e => ({
                        data: e.instance,
                        message: e.message,
                        path: e.path
                    }))
                };

                throw new Error(JSON.stringify(errorData));
            } else {
                return false;
            }
        };
    };

    return validate;
};

export const validate = createCustomValidate();
