import { validate, $schema, createCustomValidate } from '../src/validation'

describe('Test type tags', () => {
    test('Person type primitives', () => {
        type Person = {
            name: string;
            age: number;
            alive: boolean;
        };

        const PersonValidator = validate<Person>($schema<Person>());

        expect(PersonValidator({ name: 'Francisco', age: 25, alive: true })).toBe(true);
        expect(PersonValidator({ name: 'Francisco', age: 25, alive: 'some' as unknown as boolean })).toBe(false);
        expect(PersonValidator({ name: '', age: 25, alive: true })).toBe(true);
        expect(PersonValidator({ name: '', age: '12' as unknown as number, alive: true })).toBe(false);
    });

    test('Person type literals', () => {
        type Person = {
            schemaVersion: 1;
            name: string;
        };

        const PersonValidator = validate<Person>($schema<Person>());
        expect(PersonValidator({ schemaVersion: 1, name: 'Francisco' })).toBe(true);
    });

    test('Simple Person type with tags', () => {
        type SimplePerson = {
            /**
             * @regex /^[A-Z]\w{1,8}$/
             */
            name: string;

            /**
             * @min 0
             * @max 99
             */
            age: number;

            alive: boolean;
        }
        const SimplePersonValidator = validate<SimplePerson>($schema<SimplePerson>());

        // Valid
        expect(SimplePersonValidator({ name: 'Francisco', age: 25, alive: true })).toBe(true);

        // Invalid
        expect(SimplePersonValidator({ name: 'Francisco', age: 25, alive: 'some' as unknown as boolean })).toBe(false);
        expect(SimplePersonValidator({ name: '', age: 25, alive: true })).toBe(false);
        expect(SimplePersonValidator({ name: '', age: '12' as unknown as number, alive: true })).toBe(false);
        expect(SimplePersonValidator({ name: 'Francisco', age: 100, alive: true })).toBe(false);
        expect(SimplePersonValidator({ name: 'Francisco', age: -1, alive: true })).toBe(false);
        expect(SimplePersonValidator({ name: 'francisco', age: 25, alive: true })).toBe(false);
        expect(SimplePersonValidator({ name: 'Francisco', age: 25 } as any)).toBe(false);
    });

    test('Complex Person type with tags', () => {
        type ComplexPerson = {
            /**
             * @regex /^[A-Z]\w{1,8}$/
             */
            name: string;

            /**
             * @min 0
             * @max 99
             */
            age: number;

            /**
             * @alphanumeric
             */
            lastName: string;

            address: {
                /**
                 * @regex /^\d{1,5}\s[A-z]{2,30}\s[A-z]{2,15}$/
                 */
                street: string;

                /**
                 * @min 10000
                 * @max 99999
                    */
                zipCode: number;
            };
        };
        const ComplexPersonValidator = validate<ComplexPerson>($schema<ComplexPerson>());

        // Valid
        expect(ComplexPersonValidator({ name: 'Francisco', age: 25, lastName: 'Gonzalez', address: { street: '1234 Main St', zipCode: 12345 } })).toBe(true);

        // Invalid
        expect(ComplexPersonValidator({ name: 'Francisco', age: 25, lastName: 'Gonzalez', address: { street: '1234 Main St', zipCode: 1234 } })).toBe(false);
        expect(ComplexPersonValidator({ name: 'Francisco', age: 25, lastName: 'Gonzalez', address: { street: '1234 Main St', zipCode: 123456 } })).toBe(false);
        expect(ComplexPersonValidator({ name: 'Francisco', age: 25, lastName: 'Gonzalez', address: { street: '1234 Main St', zipCode: '12345' as unknown as number } })).toBe(false);
        expect(ComplexPersonValidator({ name: 'Francisco', age: 25, lastName: 'Gonzalez', address: { street: '1234 Main St *', zipCode: 12345 } } as any)).toBe(false);
        expect(ComplexPersonValidator({ name: 'Francisco', age: 25, lastName: 'Gonzalez', address: { street: '1234 Main St' } as any })).toBe(false);
        expect(ComplexPersonValidator({ name: 'Francisco', age: 25, address: { street: '1234 Main St', zipCode: 12345 } as any } as any)).toBe(false);
    });

    test('Person type with array', () => {
        type Person = {
            name: string;
            /**
             * @min 0
             * @max 99
             */
            age: number;
        }
        type Pet = {
            type: "dog" | "cat";
        };
        type PersonWithFriends = {
            name: string;
            /**
             * @min 0
             * @max 99
             */
            age: number;
            alive: boolean;
            friends: Array<Person | Pet>;
            sex: "m" | "f" | number;
        };
        const PersonValidator = validate<PersonWithFriends>($schema<PersonWithFriends>());

        expect(PersonValidator({ name: 'Francisco', age: 25, alive: true, friends: [{ name: 'John', age: 23 }], sex: "m" })).toBe(true);
        expect(PersonValidator({
            name: 'Francisco', age: 25, alive: true, friends: [
                { name: 'John', age: 23 },
                { name: 'Jane', age: 150 },
            ],
            sex: "m"
        })).toBe(false);
        expect(PersonValidator({
            name: 'Francisco', age: 25, alive: true, friends: [
                { name: 'John', age: 23 },
                { name: 'Jane', age: 23 },
                { type: "bat" as "dog" },
            ],
            sex: 3
        })).toBe(false);
        expect(PersonValidator({
            name: 'Francisco', age: 25, alive: true, friends: [
                { name: 'John', age: 23 },
                { name: 'Jane', age: 23 },
                { type: "dog" },
            ],
            sex: 150
        })).toBe(true);
    });

    test('Type alias (not supported yet)', () => {
        /**
         * @min 0
         * @max 99
         */
        type NumberAlias = number;

        const NumberAliasValidator = validate<NumberAlias>($schema<NumberAlias>());

        expect(NumberAliasValidator(0)).toBe(true);
        expect(NumberAliasValidator(99)).toBe(true);
        // expect(NumberAliasValidator(100)).toBe(false);
    });

    test('Prohibited types (functions, ...) are not allowed', () => {
        type Person = {
            /**
             * @onlyOneParameter
             */
            fn: (arg: string) => number;
        }

         const PersonValidator = validate<Person>($schema<Person>());
        expect(PersonValidator({ fn: (arg: string) => arg.length })).toBe(false);
    })

    test('Non-existent tags do nothing', () => {
        type Person = {
            /**
             * @doesNotExist
             */
            name: string;
        }
        const PersonValidator = validate<Person>($schema<Person>());
        expect(PersonValidator({ name: 'Francisco' })).toBe(true);
    });

    test("Symbols work", () => {
        type Person = {
            /**
             * @max 99
             * @min 0
             * @alphanumeric
             * @regex /abc/
             * @length 10
             */
            symbol: symbol;
        }

        const PersonValidator = validate<Person>($schema<Person>());
        expect(PersonValidator({ symbol: Symbol("Some") })).toBe(true);
    });

    test('Non-supported primitives fail', () => {
        type Person = {
            /**
             * @max 99
             */
            name: bigint;
        }

        const PersonValidator = validate<Person>($schema<Person>());
        expect(PersonValidator({ name: 123n })).toBe(false);
    });

    test('Generic types', () => {
        type Job = {
            title: string;
            /**
             * @min 0
             * @max 99
             */
            company: number;
        }

        type GenericPerson<T> = {
            name: string;
            age: number;
            job: T;
        }

        const GenericPersonValidator = validate<GenericPerson<Job>>($schema<GenericPerson<Job>>());

        expect(GenericPersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: 1 } })).toBe(true);
        expect(GenericPersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: '23' as any } })).toBe(false);
        expect(GenericPersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: 123 } })).toBe(false);
    });

    test('Unresolved generic', () => {
        type GenericPerson<T> = {
            name: string;
            age: number;
            job: T;
        }

        const GenericPersonValidator = validate<GenericPerson<any>>($schema<GenericPerson<any>>());

        expect(GenericPersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: 1 } })).toBe(true);
        expect(GenericPersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: '23' as any } })).toBe(true);
        expect(GenericPersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: 123 } })).toBe(true);
    });

    test('Generic with extended type', () => {
        type Job = {
            title: string;
            /**
             * @min 0
             * @max 99
             */
            company: number;
        }

        type GenericPerson<T extends Job> = {
            name: string;
            age: number;
            job: T;
        }

        type Person = GenericPerson<Job>;

        const PersonValidator = validate<Person>($schema<Person>());

        expect(PersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: 1 } })).toBe(true);
        expect(PersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: '23' as any } })).toBe(false);
        expect(PersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: 123 } })).toBe(false);
    });

    test('Generic with extended type and type extends', () => {
        type Job = {
            title: string;
            /**
             * @min 0
             * @max 99
             */
            company: number;
        }

        type AdvancedJob = Job & {
            /**
             * @min 1000000
             * @max 10000000
            */
            salary: number;
        }

        type GenericPerson<T extends Job> = {
            name: string;
            age: number;
            job: T;
        }

        const PersonValidator = validate<GenericPerson<AdvancedJob>>($schema<GenericPerson<AdvancedJob>>());

        expect(PersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: 1, salary: 1000000 } })).toBe(true);
        expect(PersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: 'ads' as any, salary: 1000000 } })).toBe(false);
        expect(PersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: 123, salary: 1000000 } })).toBe(false);
        expect(PersonValidator({ name: 'Francisco', age: 25, job: { title: 'John', company: 1, salary: 10000 } })).toBe(false);
    });

    test('Enums', () => {
        enum Role {
            Admin = 'admin',
            Manager = 'manager',
        }

        type Job = {
            role: Role;
            company: string;
            level: 'L4' | 'L5';
        }

        const JobValidator = validate<Job>($schema<Job>());
        // Valid
        expect(JobValidator({ role: Role.Admin, company: 'Amazon', level: 'L4' })).toBe(true);
        expect(JobValidator({ role: 'admin' as any, company: 'Amazon', level: 'L5' })).toBe(true);

        // Not valid
        expect(JobValidator({ role: 'some' as any, company: 'Amazon', level: 'L5' })).toBe(false);
    });

    test('Enums with number', () => {
        enum Role {
            Admin,
            Manager,
        }

        type Job = {
            role: Role;
            company: string;
            level: 'L4' | 'L5';
        }

        const JobValidator = validate<Job>($schema<Job>());

        // Valid
        expect(JobValidator({ role: Role.Admin, company: 'Amazon', level: 'L4' })).toBe(true);
        expect(JobValidator({ role: 0, company: 'Amazon', level: 'L5' })).toBe(true);
        expect(JobValidator({ role: Role.Manager, company: 'Amazon', level: 'L5' })).toBe(true);

        // Not valid
        expect(JobValidator({ role: 'some' as any, company: 'Amazon', level: 'L5' })).toBe(false);
    });

    test('Enums with throw', () => {
        enum Role {
            Admin,
            Manager,
        }

        type Job = {
            role: Role;
            company: string;
            level: 'L4' | 'L5';
        }

        const validate = createCustomValidate({}, true);

        const JobValidator = validate<Job>($schema<Job>());

        // Valid
        expect(JobValidator({ role: Role.Admin, company: 'Amazon', level: 'L4' })).toBe(true);
        expect(JobValidator({ role: 0, company: 'Amazon', level: 'L5' })).toBe(true);
        expect(JobValidator({ role: Role.Manager, company: 'Amazon', level: 'L5' })).toBe(true);

        // Not valid
        expect(() => JobValidator({ role: 'some' as any, company: 'Amazon', level: 'L5' })).toThrow(JSON.stringify({
            tag: "ValidationError",
            errors: [
                {
                    data: "some",
                    message: "is not of a type(s) number",
                    path: ["role"]
                },
                {
                    data: "some",
                    message: "is not one of enum values: 0,1",
                    path: ["role"]
                }
            ]
        }));
        expect(() => JobValidator({ role: Role.Admin, company: 'Amazon', level: 'L7' as 'L5' })).toThrow(JSON.stringify({
            tag: "ValidationError",
            errors: [{
                data: "L7",
                message: "is not one of enum values: L4,L5",
                path: ["level"]
            }]
        }));
    });

    test('Custom validator that throws with literal', () => {
        type Person = {
            schemaVersion: 1;
            name: string;
        };

        const PersonValidator = createCustomValidate({}, true)<Person>($schema<Person>());

        expect(() => PersonValidator({ schemaVersion: 'string' as unknown as 1, name: 'Francisco' })).toThrow(JSON.stringify({
            tag: "ValidationError",
            errors: [
                {
                    data: "string",
                    message: "is not of a type(s) number",
                    path: ["schemaVersion"],
                },
                {
                    data: "string",
                    message: "does not exactly match expected constant: 1",
                    path: ["schemaVersion"]
                }
            ]
        }));
    });

    test('Person type literals', () => {
        type Person = {
            schemaVersion: 1;
            name: string;
        };

        const PersonValidator = validate<Person>($schema<Person>());
        expect(PersonValidator({ schemaVersion: 1, name: 'Francisco' })).toBe(true);
    });

    test('Optional property', () => {
        type Company = {
            name: string;
            /**
             * @min 0
             * @max 99
            */
            employees: number;

            public?: boolean;
        }
        type Person = {
            name: string;
            // age?: number;
            company?: Company;

            /**
             * @min 0
             */
            age?: number;
        }

        const PersonValidator = validate<Person>($schema<Person>());

        expect(PersonValidator({ name: 'Francisco' })).toBe(true);
        expect(PersonValidator({ name: 'Francisco', company: {name: 'Some', employees: 10} })).toBe(true);
        expect(PersonValidator({ name: 'Francisco', company: {name: 'Some', employees: 10, public: true}, age: 1 })).toBe(true);


        expect(PersonValidator({ name: 'Francisco', company: {name: 'Some', employees: 150, public: true} })).toBe(false);

        expect(PersonValidator({ name: 'Francisco', company: {name: 'Some', employees: 10, public: true}, age: -1 })).toBe(false);
    });

    test('Custom validator', () => {
        type Company = {
            name: string;
            /**
             * @between 10-20
            */
            employees: number;

            public?: boolean;
        }
        type Person = {
            name: string;
            // age?: number;
            company?: Company;

            /**
             * @min 0
             */
            age?: number;
        }

        const validate = createCustomValidate({number: {
            between: (value: number, tag: string):boolean => {
                const range = tag.split('-').map(val => parseInt(val));

                range.push(value);
                return range.sort((a, b) => a - b)[1] === value;
            }
        }})
        const PersonValidator = validate<Person>($schema<Person>());

        expect(PersonValidator({ name: 'Francisco' })).toBe(true);
        expect(PersonValidator({ name: 'Francisco', company: {name: 'Some', employees: 10} })).toBe(true);
        expect(PersonValidator({ name: 'Francisco', company: {name: 'Some', employees: 10, public: true}, age: 1 })).toBe(true);


        expect(PersonValidator({ name: 'Francisco', company: {name: 'Some', employees: 150, public: true} })).toBe(false);

        expect(PersonValidator({ name: 'Francisco', company: {name: 'Some', employees: 10, public: true}, age: -1 })).toBe(false);
    });

    test('Custom validator that throws', () => {
        type Company = {
            name: string;
            /**
             * @between 10-20
            */
            employees: number;

            public?: boolean;
        }
        type Person = {
            name: string;
            // age?: number;
            company?: Company;

            /**
             * @min 0
             */
            age?: number;
        }

        const validate = createCustomValidate({number: {
            between: (value: number, tag: string):boolean => {
                const range = tag.split('-').map(val => parseInt(val));

                range.push(value);
                return range.sort((a, b) => a - b)[1] === value;
            }
        }}, true);

        const PersonValidator = validate<Person>($schema<Person>());

        expect(PersonValidator({ name: 'Francisco' })).toBe(true);
        expect(PersonValidator({ name: 'Francisco', company: {name: 'Some', employees: 10} })).toBe(true);
        expect(PersonValidator({ name: 'Francisco', company: {name: 'Some', employees: 10, public: true}, age: 1 })).toBe(true);


        expect(() => PersonValidator({ name: 'Francisco', company: {name: 'Some', employees: 150, public: true} })).toThrowError(JSON.stringify({
            tag: "ValidationError",
            errors: [{
                data: 150,
                message: "did not match validator [between] [10-20]",
                path: ["company", "employees"]
            }]
        }));

        expect(() => PersonValidator({ name: 'Francisco', company: {name: 'Some', employees: 15, public: true} , age: -1},)).toThrowError(JSON.stringify({
            tag: "ValidationError",
            errors: [{
                data: -1,
                message: "did not match validator [min] [0]",
                path: ["age"]
            }]
        }));
    });

    test('Expect array to fail when type changes', () => {
        type Post = {
            keywords: string[],
            title: string,
            content: string
        };

        const validate = createCustomValidate({}, true);
        const PostValidator = validate<Post>($schema<Post>());

        expect(PostValidator({keywords: ['a', 'b', 'c'], title: 'Awesome library', content: 'This should be included in TS by default'})).toBe(true);
        expect(() => PostValidator({keywords: ['a', 'b', 'c', ['d']] as string[], title: 'Awesome library', content: 'This should be included in TS by default'})).toThrowError();
        expect(() => PostValidator({keywords: ['a', 'b', 'c', ['d', {some: 'v'}]] as string[], title: 'Awesome library', content: 'This should be included in TS by default'})).toThrow(JSON.stringify({
            tag: "ValidationError",
            errors: [{ data: ["d", { some: "v" }],
            message: "is not of a type(s) string",
            path: ["keywords", 3]
        }]}));
    });

    test('Error description tag', () => {
        type Person = {
            /**
             * @regex /[a-z]{9}/
             * @error The id should be a string of length 9 and include only lower
             * case characters. Ex abcdefghi. You provided [value]
             */
            id: string;

            /**
             * @max 150
             * @min 0
             * @error {
             *   "max": "No human on earth has reached beyond 150 years old and you provided [value].",
             *   "min": "A person cannot be less than 0 years old yet."
             * }
             */
            age: number;
            height: number;
        };

        const validate = createCustomValidate({}, true);
        const PersonValidator = validate<Person>($schema<Person>());

        expect(() => PersonValidator({id: '1312d', age: 21, height: 186})).toThrowError(JSON.stringify({
            tag: "ValidationError",
            errors: [{
                data: "1312d",
                message: "did not match validator [regex] [/[a-z]{9}/] with error message: The id should be a string of length 9 and include only lower case characters. Ex abcdefghi. You provided [1312d]",
                path: ["id"]
            }]
        }));
        expect(() => PersonValidator({id: 'abcdefghi', age: 289, height: 186})).toThrowError(JSON.stringify({
            tag: "ValidationError",
            errors: [{
                data: 289,
                message: "did not match validator [max] [150] with error message: No human on earth has reached beyond 150 years old and you provided [289].",
                path: ['age']
            }]
        }));
        expect(() => PersonValidator({id: 'abcdefghi', age: -1, height: 186})).toThrowError(JSON.stringify({
            tag: "ValidationError",
            errors: [{
                data: -1,
                message: "did not match validator [min] [0] with error message: A person cannot be less than 0 years old yet.",
                path: ["age"]
            }]
        }));
    });

    test('Error description tag for custom tags', () => {
        type Person = {
            /**
             * @just9
             * @error {
             *  "just9": "Just 9 characters!!!! You provided [value]"
             * }
             */
            id: number;
        };

        const validate = createCustomValidate({
            number: {
                just9: (value: number) => value === 9
            }
        }, true);

        const PersonValidator = validate<Person>($schema<Person>());

        expect(() => PersonValidator({id: 8 })).toThrowError(JSON.stringify({
            tag: "ValidationError",
            errors: [{
                data: 8,
                message: "did not match validator [just9] with error message: Just 9 characters!!!! You provided [8]",
                path: ["id"]
            }]
        }));
    });

    test('Fixing array type aliases', () => {
        type Role = {
            /**
             * @regex /^[A-Za-z]\w{1,3}$/
             */
            name: string;
        }

        type Roles = Role[];

        type Person = {
            roles: Role[];
            rolesAlias: Roles;
        };

        const validate = createCustomValidate({}, true);

        const PersonValidator = validate<Person>($schema<Person>());

        expect(PersonValidator({roles: [{name: 'foo'}], rolesAlias: [{name: 'bar'}]})).toBe(true);
        expect( () => PersonValidator({roles: [{name: 'foo-2'}], rolesAlias: [{name: 'bar'}]})).toThrow();
    });
});
