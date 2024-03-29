/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as ts from "typescript";
import type { TsCompilerInstance } from "ts-jest/dist/types";

const isOfTypeArray = (checker: ts.TypeChecker, type: ts.Type) => ts.isArrayTypeNode(checker.typeToTypeNode(type, undefined, undefined)!);

const isPrimitiveType = (type: ts.Type): boolean => {
    switch (type.getFlags()) {
    case ts.TypeFlags.String:
    case ts.TypeFlags.Number:
    case ts.TypeFlags.Boolean:
    case ts.TypeFlags.EnumLiteral:
    case ts.TypeFlags.BigIntLiteral:
    case ts.TypeFlags.ESSymbol:
    case ts.TypeFlags.Void:
    case ts.TypeFlags.Undefined:
    case ts.TypeFlags.Null:
    case ts.TypeFlags.Never:
        return true;
    default:
        return false;
    }
};

const extractJsDoc = (node: ts.PropertySignature & {
    jsDoc: Array<{
        tags: Array<{
            tagName: {
                getText: () => string
            },
            comment: string
        }>
    }>
}) => {
    return node.jsDoc?.flatMap((doc) => doc.tags?.map((tag) => [tag.tagName.getText(), tag.comment, node.name.getText()]));
};

const buildPrimitiveType = (type: ts.Type, checker: ts.TypeChecker, tags?: string[][]) => {
    const isOptional = type.getFlags() & ts.TypeFlags.Undefined ? true : false;
    const isUnion = type.getFlags() & ts.TypeFlags.Union ? true : false;
    const isArray = isOfTypeArray(checker, type);
    const isPrimitive = isPrimitiveType(type);

    return {
        type: checker.typeToString(type),
        optional: isOptional,
        union: isUnion,
        literal: type.isLiteral(),
        array: isArray,
        primitive: isPrimitive,
        tags: tags || [],
    };
};

const buildType = (type: ts.Type, checker: ts.TypeChecker, tags?: string[][]) => {
    const symbol = type.getSymbol();

    if (symbol) {
        const prop = symbol.getDeclarations()![0];
        if (prop && ts.isPropertySignature(prop)) {
            const newTags = extractJsDoc(prop as any)?.filter((x) => x);
            if (newTags.length) {
                tags = newTags;
            }
        }
    }
    const isOptional = type.getFlags() & ts.TypeFlags.Undefined ? true : false;
    const isUnion = type.getFlags() & ts.TypeFlags.Union ? true : false;
    const isArray = isOfTypeArray(checker, type);
    const isPrimitive = isPrimitiveType(type);
    const isEnum = type.getFlags() & ts.TypeFlags.EnumLike ? true : false;

    return {
        type: checker.typeToString(type),
        optional: isOptional,
        union: isUnion,
        literal: type.isLiteral(),
        array: isArray,
        primitive: isPrimitive,
        isEnum: isEnum,
        tags: tags || [],
        children: isPrimitive ? undefined : typeToJson(type, checker),
    };
};

const buildEnumType = (type: ts.Type, checker: ts.TypeChecker) => {
    const symbol = type.getSymbol();

    if (symbol) {
        const declaration = symbol.getDeclarations()![0];

        if (ts.isEnumDeclaration(declaration)) {
            return declaration.members.map((member) => {
                return {
                    type: member.name.getText(),
                    optional: false,
                    union: false,
                    literal: true,
                    array: false,
                    primitive: false,
                    isEnum: false,
                    tags: [],
                    children: checker.getConstantValue(member),
                };
            });
        }
    }
};


function typeToJson(type: ts.Type, checker: ts.TypeChecker, tags?: string[][]): any {
    if (type.isUnion()) {
        return type.types.map((t) => buildType(t, checker, tags)).filter(c => c.type !== "undefined");
    }

    if (isPrimitiveType(type)) {
        return buildPrimitiveType(type, checker);
    }

    const symbol = type.getSymbol() || type.aliasSymbol;
    if (!symbol) {
        if (type.isLiteral()) {
            const typeName = checker.typeToString(type).replaceAll("\"", "");
            return type.isNumberLiteral() ? JSON.parse(typeName) : typeName;
        }

        if (isPrimitiveType(type)) {
            return buildPrimitiveType(type, checker, undefined);
        }

        return undefined;
    }

    if (isOfTypeArray(checker, type)) {
        return (type as any).resolvedTypeArguments.map((type: any) => buildType(type, checker));
    }

    if (symbol.getName() === "Array" || checker.isArrayType(type)) {
        // Handle arrays explicitly if not caught by the above type reference check
        return (type as ts.TypeReference).typeArguments?.map((t) => buildType(t, checker));
    }

    const properties = checker.getPropertiesOfType(type);
    const json: { [key: string]: any } = {};

    for (const prop of properties) {
        const x = prop.getDeclarations()![0];
        let tags;
        if (x && ts.isPropertySignature(x)) {
            tags = extractJsDoc(x as any)?.filter((x) => x);
        }

        const propName = prop.getName();
        const propType = checker.getTypeOfSymbolAtLocation(prop, symbol.getDeclarations()![0]);
        const typeName = checker.typeToString(propType);
        const isOptional = prop.getFlags() & ts.SymbolFlags.Optional ? true : false;
        const isUnion = propType.getFlags() & ts.TypeFlags.Union ? true : false;
        const isArray = isOfTypeArray(checker, propType) || checker.isArrayType(propType);
        const isPrimitive = isPrimitiveType(propType) || typeName === "boolean";
        const isEnum = propType.getFlags() & ts.TypeFlags.EnumLike ? true : false;

        json[propName] = {
            type: typeName,
            optional: isOptional,
            union: isUnion,
            literal: propType.isLiteral(),
            array: isArray,
            primitive: isPrimitive,
            enum: isEnum,
            tags: tags || [],
        };

        if (isEnum) {
            json[propName].children = buildEnumType(propType, checker);
        }
        else if (!isPrimitive) {
            if (!isArray && checker.isArrayType(propType)) {
                console.log("####", (propType as ts.TypeReference).typeArguments);

                json[propName].children = typeToJson((propType as ts.TypeReference).typeArguments![0], checker, tags);
            } else {
                json[propName].children = typeToJson(propType, checker, tags);
            }
        }
    }

    return json;
}

const transformer = (program: ts.Program) => (context: ts.TransformationContext) => {
    const validators = new Map<string, ts.Node[]>();

    const visitor: ts.Visitor = (node) => {
        // if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
        //     const json = buildType(program.getTypeChecker().getTypeAtLocation(node), program.getTypeChecker());

        //     validators.set(node.name.text, [ts.factory.createStringLiteral(JSON.stringify(json))]);
        // }

        if (ts.isCallExpression(node) && node.expression.getText() === "$schema") {
            const type = node.typeArguments![0];
            const json = buildType(program.getTypeChecker().getTypeAtLocation(type), program.getTypeChecker());
            validators.set(node.typeArguments![0].getText(), [ts.factory.createStringLiteral(JSON.stringify(json))]);
            const validator = validators.get(type.getText());
            if (validator) {
                return validator;
            }
        }

        if (ts.isImportSpecifier(node) && node.getText().includes("$validate")) {
            return ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier("validate"));
        }

        return ts.visitEachChild(node, visitor, context);
    };

    return (sourceFile: ts.SourceFile) => ts.visitNode(sourceFile, visitor);
};

// Jest-transformer
export const version = Date.now();
// Used for constructing cache key
export const name = "type-safe-transformer";
export const factory = (compilerInstance: TsCompilerInstance) => transformer(compilerInstance.program!);

export default (program: ts.Program, config?: any) => transformer(program);
