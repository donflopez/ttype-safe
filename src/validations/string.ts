import { createValidatorFor } from "./common";

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
     * Test if the string is not longer than the provided length
     * 
     * @example
     * ```ts
     * type Person = {
     * /**
     * * @maxlength 10
     * *\/
     * lastName: string;
     * }
     * ```
     * 
     * @param value
     * @param length
     * @returns
     */
    maxlength: (value: string, length: string) => value.length <= parseInt(length),
};

export const validateString = createValidatorFor(isString, TAGS);
