# TypeSafe
TypeSafe is a TypeScript library that allows you to generate runtime validation rules from TypeScript types defined in your code. By analyzing your type definitions at build time, TypeSafe creates a set of validators that can be used to validate data structures at runtime, ensuring that they conform to the expected TypeScript types.

With TypeSafe, you can also add custom rules to your TypeScript types using JSDoc comments. Simply add a comment to your type definition that specifies the desired validation rule using one of the supported JSDoc tags: @regex, @max, @min, or @alphanumeric. TypeSafe will then generate a custom validator that enforces the specified rule at runtime.

TypeSafe integrates easily with your existing TypeScript workflow, and can be configured to generate validation rules for complex nested types, including arrays, tuples, and object literals. With the support for custom rules, you can create even more precise and tailored validation logic that fits your specific use case.

With TypeSafe, you can create more robust and reliable TypeScript applications, with less effort and fewer errors. Try it out today, and see how easy it is to add runtime validation to your TypeScript projects!

# Getting Started

## Using it with [ttypescript]()

## Example using TypeSafe
```ts
import { $schema, validate } from "./validate";

// Define your TypeScript types with custom validation rules using JSDoc comments
type Person = {
  /**
   * The name property must be a string with at least 2 characters
   * @minlength 2
   */
  name: string;

  /**
   * The age property must be a number between 0 and 120
   * @min 0
   * @max 120
   */
  age: number;

  /**
   * The email property must be a string that contains an '@' character
   * @regex /@/
   */
  email: string;
};

// Create a validator function for the Person type
export const PersonValidation = validate<Person>($schema<Person>());

// Test the validator function with sample data
const validPerson = { name: "John", age: 35, email: "john@example.com" };
const invalidPerson = { name: "J", age: 150, email: "invalid-email" };

console.log(PersonValidation(validPerson)); // good
console.log(PersonValidation(invalidPerson)); // bad
```
