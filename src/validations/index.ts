export type ValidatorStructure<T> = {
    name: string;
    is: (x: unknown) => x is T,
    tags: TagValidator<T>,
}

export type TagValidator<T> = {
    [tag: string]: (value: T, tagInput: string) => boolean
};
