# ttype-Safe (TTS)
TypeSafe is a TypeScript library that generates runtime validation rules from your code's TypeScript types. It analyzes your type definitions at build time and creates validators for validating data structures at runtime, ensuring they conform to expected types. You can add custom rules to types using JSDoc comments with tags like @regex and @max. It's easy to integrate with your TypeScript workflow and supports complex nested types like arrays and tuples. It helps create more reliable applications with less effort and fewer errors.

> **WARNING:** This library is under heavy development, many features are still missing and the API will change as I explore what is the most developer friendly way to secure your types. You should expect changes in the main apis and tags used to add validation rules.

## How does it compares with others

### Zod

Zod the lead of this type of tools, while in spirit both ttype-safe and zod aim for the goal the approaches are radically different. Zod exposes a series of methods that
allows you to build validators and extract the types from these. TTS aims to offer the native TS experience when building types and with the support of jsdocs allow you to use validation rules with minimal effort.

A zod example:

```ts
const User = z.object({
  username: z.string().min(3).max(10),
});

User.parse({username: 'no'}) // throws
User.parse({username: 'valid'}) // passes

// To get and use the type you need to.
type User = z.infer<typeof User>;
```

A TTS example:
```ts
type User = {
  /**
   * Name of the user to use in the application. This has to be unique and cannot be changed once saved.
   *
   * @min 3
   * @max 10
   */
  username: string
}

const ƒUser = validate<User>($schema<User>());

ƒUser({username: 'no'}) // false
ƒUser({username: 'valid'}) // true
```

TTS has several advantages:
- You keep the native type experience, so you don't need to learn how to create types with Zod and you get typechecking out of the box without using comments, all type validators that you create will check primitives like number, string, boolean.
- Working with generics and complex types just works, again you don't need to learn how to work with generics.
- Comment tags that add validation rules can be customized and reused, you don't need to import them. You just need to pass your custom validator.
- **This is the most important one**, you can comment your types and generate automatic documentation with ts docs. I'm working on a plugin that will include a tag definition as validation rules so
documentation of your rules is for free.

# Getting Started

[You can find a working example project here](https://github.com/donflopez/ttype-safe-example-project)

## Importing ttype-safe and ts-patch

```package.json
"devDependencies": {
  "ts-patch": "3.1.2",
  "ttype-safe": "^0.6.0"
},
"scripts": {
  ...
  "prepare": "ts-patch install -s",
  ...
}
```

## Configuring [ts-patch](https://github.com/nonara/ts-patch)

To use tType-Safe with [ts-patch](https://github.com/nonara/ts-patch), you need to add the following to your `tsconfig.json` file:

```json
{
  "compilerOptions": {
    "moduleResolution": "node16", // or NodeNext
    "plugins": [
      {
        "transform": "ttype-safe"
      }
    ]
  }
}
```

And then you need to build your project with `ttsc` instead of `tsc`.

How to create validators:

```ts
import { $schema, validate } from "ttype-safe/validate";

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
```

Your compiled code will replace `$schema` with the generated validation rules extracted from your TypeScript types and TsDoc comments. The `validate` function will create a validator function that will validate the data structure at runtime.

## Adding custom tags

You can create custom tags for primitive types, like @max or @regex but. In the following example we're going to create a tag for dates:

```ts
const validate = createCustomValidate({
  string: {
    date: (value: string): boolean => {
      return new RegExp(/^\d{4}-\d{2}-\d{2}$/).test(value);
    }
  }
});

type Person = {
  /**
   * @date
   */
  birthday: string;
};

const PersonValidator = validate<Person>($schema<Person>());

PersonValidator({ birthday: "2021-01-01" }); // good
PersonValidator({ birthday: "2021-01-01T00:00:00" }); // bad
```

## Throwing automated errors

```ts
const validate = createCustomValidate({
  string: {
    date: (value: string): boolean => {
      return new RegExp(/^\d{4}-\d{2}-\d{2}$/).test(value);
    }
  }
}, true); // Pass true to throw instead of returning false

type Person = {
  /**
   * @date
   */
  birthday: string;
};

const PersonValidator = validate<Person>($schema<Person>());

PersonValidator({ birthday: "2021-01-01" }); // good
PersonValidator({ birthday: "2021-01-01T00:00:00" }); // Throws -> ValidationError: Tag validation [date] and comment [null] didn't succeed for value [2021-01-01T00:00:00]
```

## Using it with jest

> Note: This is only supported with ts-jest v29 or higher.

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
import { $schema, validate } from "ttype-safe/validation";

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
type Car = {
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
type Car = {
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
type Car = {
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
type Car = {
  /**
   * @max 3
   */
  plate: string;
}

const CarValidator = validate<Car>($schema<Car>());
CarValidator({ plate: "1ABC123" }); // good
CarValidator({ plate: "1ABC1234" }); // bad
```

#### 5. Email
```ts
type Person = {
  /**
   * @email
   */
  email: string;
}

const EmailValidator = validate<Person>($schema<Person>());
EmailValidator({ email: "John1988@gmail.com" }); // good
EmailValidator({ email: "myEmail" }); // bad
```

#### 6. Notempty
```ts
type Person = {
  /**
   * @notempty
   */
  firstName: string;
}

const NotemptyValidator = validate<Person>($schema<Person>());
NotemptyValidator({ firstName: "John" }); // good
NotemptyValidator({ firstName: "" }); // bad
```

## Numbers

### Tags:
#### 1. Min
```ts
type Human = {
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
type Human = {
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
type Human = {
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
type Human = {
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
type Human = {
  /**
   * @min 0
   */
  age: () => void;
}
// This will do nothing, nor validate the type nor the tags.
const HumanValidator = validate<Human>($schema<Human>());
```
