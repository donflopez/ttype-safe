export type isTypeFn = (x: any) => boolean;

export type Tags = Record<string, (value: any, comment: string) => boolean>;

export const createValidatorFor = <T>(isTypeFn: isTypeFn, rules: Tags) => (value: T, tags: string[][]) => {
    if (!isTypeFn(value)) {
        return false;
    }

    for (const [tag, comment] of tags) {
        if (rules[tag]) {
            if (!rules[tag](value, comment)) {
                return false;
            }
        }
    }

    return true;
};
