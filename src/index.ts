/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as ts from "typescript";

const extractJsDoc = (node: ts.PropertySignature) => {
    return node.jsDoc?.flatMap((doc) => doc.tags?.map((tag) => [tag.tagName.getText(), tag.comment, node.name.getText()]));
};

function typeToJson(type: ts.Type, checker: ts.TypeChecker): any {
    if (type.isUnion()) {
        return type.types.map((t) => typeToJson(t, checker));
    }

    const symbol = type.getSymbol();
    if (!symbol) {
        return type.isLiteral() ? checker.typeToString(type).replaceAll("\"", "") : undefined;
    }

    const properties = checker.getPropertiesOfType(type);
    const json: { [key: string]: any } = {};
    for (const prop of properties) {

        const x = prop.getDeclarations()![0];
        let tags;
        if (x && ts.isPropertySignature(x)) {
            tags = extractJsDoc(x)?.filter((x) => x);
        }

        const propName = prop.getName();
        const propType = checker.getTypeOfSymbolAtLocation(prop, symbol.getDeclarations()![0]);
        const isOptional = propType.getFlags() & ts.TypeFlags.Undefined ? true : false;
        const isUnion = propType.getFlags() & ts.TypeFlags.Union ? true : false;

        json[propName] = {
            type: checker.typeToString(propType),
            optional: isOptional,
            union: isUnion,
            literal: propType.isLiteral(),
            tags: tags || [],
            children: typeToJson(propType, checker),
        };
    }

    return json;
}

export default (program: ts.Program, config?: any): ts.TransformerFactory<ts.SourceFile> => (context) => {

    const validators = new Map<string, ts.Node[]>();

    const visitor: ts.Visitor = (node) => {
        if (ts.isTypeAliasDeclaration(node) || ts.isInterfaceDeclaration(node)) {
            const json = typeToJson(program.getTypeChecker().getTypeAtLocation(node), program.getTypeChecker());

            validators.set(node.name.text, [ts.factory.createStringLiteral(JSON.stringify(json))]);
        }

        if (ts.isCallExpression(node) && node.expression.getText() === "$schema") {
            const type = node.typeArguments![0];
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

    return (sourceFile) => ts.visitNode(sourceFile, visitor);
};
