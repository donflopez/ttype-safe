import { validate, $schema } from '../../src/validate'

describe('Test string tags', () => {
    test('regex', () => {
        type TestRegex = {
            /**
             * @regex /^[a-zA-Z0-9.!#]+\w{1,10}$/
             */
            text: string;
        }
        const TestRegexValidator = validate<TestRegex>($schema<TestRegex>());

        expect(TestRegexValidator({ text: "fsa31!#f1" })).toBe(true);
        expect(TestRegexValidator({ text: ".1!#f1##_" })).toBe(true);

        expect(TestRegexValidator({ text: "312321*" })).toBe(false);
        expect(TestRegexValidator({ text: "-fsfs" })).toBe(false);
        expect(TestRegexValidator({ text: "" })).toBe(false);
        expect(TestRegexValidator({ text: "!_stringtoolong" })).toBe(false);
    })

    test('alphanumeric', () => {
        type TestAlphanumeric = {
            /**
             * @alphanumeric
             */
            text: string;
        }
        const TestAlphanumericValidator = validate<TestAlphanumeric>($schema<TestAlphanumeric>());

        expect(TestAlphanumericValidator({ text: 'abc123' })).toBe(true);
        expect(TestAlphanumericValidator({ text: 'ABC1234567890' })).toBe(true);

        expect(TestAlphanumericValidator({ text: '_' })).toBe(false);
        expect(TestAlphanumericValidator({ text: '*' })).toBe(false);
        expect(TestAlphanumericValidator({ text: '-' })).toBe(false);
        expect(TestAlphanumericValidator({ text: '/' })).toBe(false);
        expect(TestAlphanumericValidator({ text: '#' })).toBe(false);
        expect(TestAlphanumericValidator({ text: '@' })).toBe(false);
        expect(TestAlphanumericValidator({ text: '$' })).toBe(false);
        expect(TestAlphanumericValidator({ text: '' })).toBe(false);
    })

    test("max", () => {
        type TestMax = {
            /**
             * @max 3
             */
            text: string;
        }
        const TestMaxValidator = validate<TestMax>($schema<TestMax>());

        expect(TestMaxValidator({ text: 'abc' })).toBe(true);
        expect(TestMaxValidator({ text: '123' })).toBe(true);
        expect(TestMaxValidator({ text: '+!~' })).toBe(true);
        expect(TestMaxValidator({ text: '' })).toBe(true);

        expect(TestMaxValidator({ text: '1234' })).toBe(false);
        expect(TestMaxValidator({ text: 'abc#' })).toBe(false);
    });

    test("min", () => {
        type TestMin = {
            /**
             * @min 4
             */
            text: string;
        }
        const TestMinValidator = validate<TestMin>($schema<TestMin>());

        expect(TestMinValidator({ text: 'abcd' })).toBe(true);
        expect(TestMinValidator({ text: '1234' })).toBe(true);
        expect(TestMinValidator({ text: '+!~*' })).toBe(true);

        expect(TestMinValidator({ text: '' })).toBe(false);
        expect(TestMinValidator({ text: '123' })).toBe(false);
        expect(TestMinValidator({ text: '#@%' })).toBe(false);
    });

    test('email', () => {
        type TestEmail = {
            /**
             * @email
             */
            email: string;
        }
        const TestEmailValidator = validate<TestEmail>($schema<TestEmail>());

        // see https://en.wikipedia.org/wiki/Email_address#Examples for reference
        expect(TestEmailValidator({ email: 'simple@example.com' })).toBe(true);
        expect(TestEmailValidator({ email: 'very.common@example.com' })).toBe(true);
        expect(TestEmailValidator({ email: 'disposable.style.email.with+symbol@example.com' })).toBe(true);
        expect(TestEmailValidator({ email: 'other.email-with-hyphen@example.com' })).toBe(true);
        expect(TestEmailValidator({ email: 'fully-qualified-domain@example.com' })).toBe(true);
        expect(TestEmailValidator({ email: 'user.name+tag+sorting@example.com' })).toBe(true);
        expect(TestEmailValidator({ email: 'x@example.com' })).toBe(true);
        expect(TestEmailValidator({ email: 'example-indeed@strange-example.com' })).toBe(true);
        expect(TestEmailValidator({ email: 'test/test@test.com' })).toBe(true);
        expect(TestEmailValidator({ email: 'admin@mailserver1' })).toBe(true);
        expect(TestEmailValidator({ email: 'example@s.example' })).toBe(true);
        expect(TestEmailValidator({ email: 'mailhost!username@example.org' })).toBe(true);
        expect(TestEmailValidator({ email: 'user%example.com@example.org' })).toBe(true);

        expect(TestEmailValidator({ email: 'Abc.example.com' })).toBe(false);
        expect(TestEmailValidator({ email: 'A@b@c@example.com' })).toBe(false);
        expect(TestEmailValidator({ email: 'a"b(c)d,e:f;g<h>i[j\\k]l@example.com' })).toBe(false);
        expect(TestEmailValidator({ email: 'just"not"right@example.com' })).toBe(false);
        expect(TestEmailValidator({ email: 'this is"not\\allowed@example.com' })).toBe(false);
        expect(TestEmailValidator({ email: 'this\\ still\\"not\\\\allowed@example.com' })).toBe(false);
        expect(TestEmailValidator({ email: 'i_like_underscore@but_its_not_allowed_in_this_part.example.com' })).toBe(false);
        expect(TestEmailValidator({ email: 'QA[icon]CHOCOLATE[icon]@test.com' })).toBe(false);
    })
})