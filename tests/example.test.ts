import { validate, $schema } from '../src/validation'

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

    test('Non-existent tags do nothing', () => {
        type Person = {
            /**
             * @doesNotExist
             */
            name: string;

            fn: () => void;
        }
        const PersonValidator = validate<Person>($schema<Person>());
        expect(PersonValidator({ name: 'Francisco', fn: () => void 0 })).toBe(true);
    });

    test('Non-supported primitives do nothing', () => {
        type Person = {
            /**
             * @max 99
             */
            name: bigint;

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

        expect(PersonValidator({ name: 123n, symbol: Symbol("Some") })).toBe(true);
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

        // Not valid
        expect(JobValidator({ role: 'some' as any, company: 'Amazon', level: 'L5' })).toBe(false);
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
});
