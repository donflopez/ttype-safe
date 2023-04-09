import { validate, $schema } from '../src/validate'

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
});
