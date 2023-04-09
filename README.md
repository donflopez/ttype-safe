# TypeSafe
TypeSafe is a TypeScript library that allows you to generate runtime validation rules from TypeScript types defined in your code. By analyzing your type definitions at build time, TypeSafe creates a set of validators that can be used to validate data structures at runtime, ensuring that they conform to the expected TypeScript types.

With TypeSafe, you can also add custom rules to your TypeScript types using JSDoc comments. Simply add a comment to your type definition that specifies the desired validation rule using one of the supported JSDoc tags: @regex, @max, @min, or @alphanumeric. TypeSafe will then generate a custom validator that enforces the specified rule at runtime.

TypeSafe integrates easily with your existing TypeScript workflow, and can be configured to generate validation rules for complex nested types, including arrays, tuples, and object literals. With the support for custom rules, you can create even more precise and tailored validation logic that fits your specific use case.

With TypeSafe, you can create more robust and reliable TypeScript applications, with less effort and fewer errors. Try it out today, and see how easy it is to add runtime validation to your TypeScript projects!

# Getting Started

## Using it with [ttypescript]()

To use Type-Safe with [ttypescript](), you need to add the following to your `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "type-safe"
      }
    ]
  }
}
```

And then you need to build your project with `ttsc` instead of `tsc`.

## Using it with jest

To use Type-Safe with jest, you need to add the following to your `jest.config.js` and use ts-jest file:

```json
// Package.json
"jest": {
    "transform": {
      "^.+\\.tsx?$": [
        "ts-jest",
        {
          "astTransformers": {
            "before": [
              "ttype-safe"
            ]
          }
        }
      ]
    }
  }
```

## Example using TypeSafe
```ts
import { $schema, validate } from "./validate";

// Define your TypeScript types with custom validation rules using JSDoc comments
type Person = {
  /**
   * The name property must be a string with at least 2 characters
   * @min 2
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
export const PersonValidator = validate<Person>($schema<Person>());

// Test the validator function with sample data
const validPerson = { name: "John", age: 35, email: "john@example.com" };
const invalidPerson = { name: "J", age: 150, email: "invalid-email" };

console.log(PersonValidator(validPerson)); // good
console.log(PersonValidator(invalidPerson)); // bad
```

# Features

## Strings

### Tags:
#### 1. Regex
```ts
type Car {
  /**
   * @regex /\d[A-Z]{3}\d{3}/
   */
  plate: string;
}
const CarValidator = validate<Car>($schema<Car>());
CarValidator({ plate: "1ABC123" }); // good
CarValidator({ plate: "1ABC12" }); // bad
```

#### 2. Alphanumeric
```ts
type Car {
  /**
   * @alphanumeric
   */
  plate: string;
}
const CarValidator = validate<Car>($schema<Car>());
CarValidator({ plate: "1ABC123" }); // good
CarValidator({ plate: "1ABC12#" }); // bad
```

#### 3. Min
```ts
type Car {
  /**
   * @min 3
   */
  plate: string;
}
const CarValidator = validate<Car>($schema<Car>());
CarValidator({ plate: "1ABC123" }); // good
CarValidator({ plate: "1A" }); // bad
```

#### 4. Max
```ts
type Car {
  /**
   * @max 3
   */
  plate: string;
}

const CarValidator = validate<Car>($schema<Car>());
CarValidator({ plate: "1ABC123" }); // good
CarValidator({ plate: "1ABC1234" }); // bad
```

## Numbers

### Tags:
#### 1. Min
```ts
type Human {
  /**
   * @min 0
   */
  age: number;
}

const HumanValidator = validate<Human>($schema<Human>());
HumanValidator({ age: 0 }); // good
HumanValidator({ age: -1 }); // bad
```

#### 2. Max
```ts
type Human {
  /**
   * @max 100
   */
  age: number;
}

const HumanValidator = validate<Human>($schema<Human>());
HumanValidator({ age: 100 }); // good
HumanValidator({ age: 101 }); // bad
```

## Not Supported:
- Type Aliases jsdoc tags are not supported yet:
```ts
/**
 * @min 0
 * @max 100
 */
type Age = number;
// Doesn't work yet, it will only validate the type as a number but no
// the min and max tags
const AgeValidator = validate<Age>($schema<Age>());
```
- BigInt is not supported and tags will be ignored:
```ts
type Human {
  /**
   * @min 0
   */
  age: bigint;
}
// This will do nothing, nor validate the type nor the tags.
const HumanValidator = validate<Human>($schema<Human>());
```

- Symbol is not supported and tags will be ignored:
```ts
type Human {
  /**
   * @min 0
   */
  age: symbol;
}
// This will do nothing, nor validate the type nor the tags.
const HumanValidator = validate<Human>($schema<Human>());
```
- Functions are not supported and will probably never be supported;
```ts
type Human {
  /**
   * @min 0
   */
  age: () => void;
}
// This will do nothing, nor validate the type nor the tags.
const HumanValidator = validate<Human>($schema<Human>());
```
