import { createValidatorFor } from "./common";

const isNumber = (x: any): x is number => typeof x === "number";

const TAGS = {
    /**
     * Use this tag to validate if a number is less than or equal to a given number
     * 
     * @example
     * ```ts
     * type Ranges = {
     *   /**
     *   * @max 100
     *   *\/
     *   end: number;
     * }
     * ```
     * @param value 
     * @param max 
     * @returns true if value is less than or equal to max
     */
    max: (value: number, max: string) => value <= parseInt(max),

    /**
     * Use this tag to validate if a number is greater than or equal to a given number
     * 
     * @example
     * ```ts
     * type Ranges = {
     *   /**
     *   * @min 0
     *   *\/
     *   start: number;
     * }
     * ```
     * @param value
     * @param min
     * @returns true if value is greater than or equal to min
     */
    min: (value: number, min: string) => value >= parseInt(min),
};

export const validateNumber = createValidatorFor(isNumber, TAGS);
