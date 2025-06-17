import { $schema, validate } from "../src/validation";

describe("enums", () => {
  test("Regular enums", () => {
    enum Enum {
      value,
      value2
    }

    const EnumValidator = validate<Enum>($schema<Enum>());

    expect(EnumValidator(Enum.value)).toBe(true);
    expect(EnumValidator(Enum.value2)).toBe(true);
  });

  test("String enums", () => {
    enum Enum {
      value = "value",
      value2 = "value-2"
    }

    const EnumValidator = validate<Enum>($schema<Enum>());

    expect(EnumValidator(Enum.value)).toBe(true);
    expect(EnumValidator(Enum.value2)).toBe(true);

    expect(EnumValidator("value" as Enum)).toBe(true);
    expect(EnumValidator("value-2" as Enum)).toBe(true);
  });

  test("Mapped enum keys", () => {
    enum Enum {
      value = "value",
      value2 = "value-2"
    }

    type Mapped = Record<Enum, string>;

    const MappedValidator = validate<Mapped>($schema<Mapped>());

    expect(MappedValidator({ [Enum.value]: 'string', [Enum.value2]: 'other' })).toBe(true);
    expect(MappedValidator({ value: 'string', "value-2": 'other' })).toBe(true);

    expect(MappedValidator({} as Mapped)).toBe(false);
    expect(MappedValidator({ value: 'string' } as Mapped)).toBe(false);
  });

  test("Partially mapped enum keys", () => {
    enum Enum {
      value = "value",
      value2 = "value-2"
    }

    type PartialMapped = Partial<Record<Enum, string>>;

    const MappedValidator = validate<PartialMapped>($schema<PartialMapped>());

    expect(MappedValidator({ [Enum.value2]: 'other' })).toBe(true);
    expect(MappedValidator({ value: 'string', "value-2": 'other' })).toBe(true);
    expect(MappedValidator({})).toBe(true);
    expect(MappedValidator({ value: 'string' })).toBe(true);

    expect(MappedValidator({ a: 2 } as PartialMapped)).toBe(true); // unknown keys are fine
  });
})
