export type isTypeFn = (x: any) => boolean;
export type Tag = (value: any, comment: string) => boolean;
export type Tags = Record<string, Tag>;

export const handleCustomError = <T>(tag: string, value: T, error: string) => {
    if (error.trim()[0] === "{") {

        const customErrorObject = JSON.parse(error);

        if (customErrorObject[tag]) {
            const message = customErrorObject[tag];

            throw new Error(`ValidationError on tag [${tag}] with error message: \n${message.replaceAll("\n", " ").replaceAll("[value]", `[${value}]`)}`);
        }
    }

    throw new Error(`ValidationError on tag [${tag}] with error message: \n${error.replaceAll("\n", " ").replaceAll("[value]", `[${value}]`)}`);
};

export const throwTagError = <T>(tag: string, comment: string, value: T, tags: string[][]) => {
    const customError = tags.find(tag => tag[0] === "error");
    if (customError) {
        handleCustomError(tag, value, customError[1]);
    }
    else {
        throw new Error(`ValidationError: Tag validation [${tag}] and comment [${comment}] didn't succeed for value [${value}]`);
    }
};

export const throwPrimitiveError = <T>(primitive: string, value: T) => {
    throw new Error(`ValidationError: Value [${value}] is not of type [${primitive}].`);
};

export const createValidatorFor = <T>(name: string, isTypeFn: isTypeFn, rules: Tags) => (value: T, tags: string[][], shouldThrow = false) => {
    if (!isTypeFn(value)) {
        
        if (shouldThrow) {
            throwPrimitiveError(name, value);
        }
        
        return false;
    }

    for (const [tag, comment] of tags) {
        if (rules[tag]) {
            if (!rules[tag](value, comment)) {
                if (shouldThrow) {
                    throwTagError(tag, comment, value, tags);
                }
                return false;
            }
        }
    }

    return true;
};
