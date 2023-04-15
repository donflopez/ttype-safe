export type isTypeFn = (x: any) => boolean;
export type Tag = (value: any, comment: string) => boolean;
export type Tags = Record<string, Tag>;

export const createValidatorFor = <T>(isTypeFn: isTypeFn, rules: Tags) => (value: T, tags: string[][], shouldThrow = false) => {
    if (!isTypeFn(value)) {
        return false;
    }

    for (const [tag, comment] of tags) {
        if (rules[tag]) {
            if (!rules[tag](value, comment)) {
                if (shouldThrow) {
                    throw new Error(`ValidationError: Tag validation [${tag}] and comment [${comment}] didn't succeed for value [${value}]`);
                }
                return false;
            }
        }
    }

    return true;
};
