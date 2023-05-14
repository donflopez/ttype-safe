import { createValidatorFor } from "./common";

const isBoolean = (value: unknown): value is boolean => typeof value === "boolean";

export const validateBoolean = createValidatorFor("boolean", isBoolean, {});
