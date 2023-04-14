import { Tags, createValidatorFor } from "./common";

const isString = (x: any): x is string => typeof x === "string";

const TAGS = {
    /**
     * Test the value of the string against the provided regex
     * 
     * @example
     * ```ts
     * type Person = {
     *   /**
     *   * @regex /^\w{3, 8}$/
     *   *\/
     *   name: string;
     * }
     * ```
     * 
     * @param value 
     * @param regex 
     * @returns 
     */
    regex: (value: string, regex: string) => {
        const re = new RegExp(regex.replaceAll("/", ""));
        return re.test(value);
    },

    /**
     * Test if the string is alphanumeric
     * 
     * @example
     * ```ts
     * type Person = {
     *  /**
     * * @alphanumeric
     * *\/
     * lastName: string;
     * }
     * ```
     * 
     * @param value
     * @returns 
     */
    alphanumeric: (value: string) => TAGS.regex(value, "/^[a-zA-Z0-9]+$/"),

    /**
     * Test if the string is shorter than the provided length
     * 
     * @example
     * ```ts
     * type Person = {
     * /**
     * * @max 10
     * *\/
     * lastName: string;
     * }
     * ```
     * 
     * @param value
     * @param length
     * @returns
     */
    max: (value: string, length: string) => value.length <= parseInt(length),

    /**
     * Test if the string is larger than the provided length
     * 
     * @example
     * ```ts
     * type Person = {
     * /**
     * * @min 10
     * *\/
     * lastName: string;
     * }
     * ```
     * 
     * @param value
     * @param length
     * @returns
     */
    min: (value: string, length: string) => value.length >= parseInt(length),

    /**
     * Test if the string is an email
     *
     * @example
     * ```ts
     * type Person = {
     * /**
     * * @email
     * *\/
     * email: string;
     * }
     * ```
     *
     * @param value
     * @returns
     */
    email: (value: string) => {
        const emailRegExp = new RegExp(/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/);
        return emailRegExp.test(value);
    },
};

export const validateString = createValidatorFor(isString, TAGS);

export const customStringValidator = (tags: Tags) => createValidatorFor<string>(isString, {...TAGS, ...tags});
