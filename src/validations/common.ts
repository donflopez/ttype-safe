import { ValidatorResult } from "jsonschema";

export type isTypeFn = (x: any) => boolean;
export type Tag = (value: any, comment: string) => boolean;
export type Tags = Record<string, Tag>;

export type TypedTags = [type: string, tag: string, value: string|undefined][];

const customErrorSuffix = (allTags: TypedTags, tag: string, input: unknown): string => {
    const errorTag: TypedTags[number] | undefined = allTags.find(([, tag]) => tag === "@error");
    if (!errorTag || !errorTag[2]) return "";

    let errorMsg: string;
    if (errorTag[2].trim()[0] === "{") {
        const errorJson = JSON.parse(errorTag[2]);
        if (!(tag in errorJson)) return "";

        errorMsg = errorJson[tag];
    } else {
        errorMsg = errorTag[2];
    }

    return " with error message: " + errorMsg.replaceAll("\n", " ").replaceAll("[value]", `[${input}]`);
};

export const handleNoCommentTag = (result: ValidatorResult, allTags: TypedTags, tag: string, input: unknown): ValidatorResult => {
    result.addError(`did not match validator [${tag}]${customErrorSuffix(allTags, tag, input)}`);
    return result;
};

export const handleCommentTag = (result: ValidatorResult, allTags: TypedTags, tag: string, tagValue: string, input: unknown): ValidatorResult => {
    result.addError(`did not match validator [${tag}] [${tagValue}]${customErrorSuffix(allTags, tag, input)}`);
    return result;
};

