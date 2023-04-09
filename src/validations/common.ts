type isTypeFn = (x: any) => boolean;

export const createValidatorFor = (isTypeFn: isTypeFn, rules: Record<string, (value: any, comment: string) => boolean>) => (value: any, tags: string[][]) => {
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
