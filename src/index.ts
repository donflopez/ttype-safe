/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as ts from "typescript";
import type { TsCompilerInstance } from "ts-jest/dist/types";
import { CompletedConfig, createFormatter, createParser, DEFAULT_CONFIG, SchemaGenerator } from "ts-json-schema-generator";

const makeConfig = (): CompletedConfig => {
    return {
        ...DEFAULT_CONFIG,
        "type": "*",
        "additionalProperties": true,
        "discriminatorType": "json-schema",
        "encodeRefs": true,
        "expose": "all",
        "fullDescription": true,
        "markdownDescription": false,
        "functions": "hide",
        "jsDoc": "extended",
        "minify": true,
        "skipTypeCheck": true,
        "sortProps": true,
        "strictTuples": true,
        "topRef": true,
    };
};

export const makeTypeBuilder = (program: ts.Program) => (type: ts.Node): object => {
    const config = makeConfig();

    const gen = new SchemaGenerator(program, createParser(program, config), createFormatter(config), config);

    return gen.createSchemaFromNodes([type]);
};

const transformer = (program: ts.Program) => (context: ts.TransformationContext) => {
    const validators = new Map<string, ts.Node[]>();

    const generator = makeTypeBuilder(program);

    const visitor: ts.Visitor = (node) => {

        if (ts.isCallExpression(node) && node.expression.getText() === "$schema") {
            const type = node.typeArguments![0];

            const json = generator(type);

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
