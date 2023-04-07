import { createValidatorFor } from "./common";

const isString = (x: any): x is string => typeof x === "string";

const TAGS = {
    runRegex: (value: string, regex: string) => {
        const re = new RegExp(regex.replaceAll("/", ""));
        return re.test(value);
    },

    alphanumeric: (value: string) => TAGS.runRegex(value, "/^[a-zA-Z0-9]+$/"),
};

export const validateString = createValidatorFor(isString, TAGS);
