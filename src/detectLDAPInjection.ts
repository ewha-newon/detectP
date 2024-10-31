import * as acorn from "acorn";
import * as walk from "acorn-walk";

export function detectLDAPInjection(code: string): { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] {
    const userInputs: string[] = [];
    const results: { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] = [];
    let parseFilterFound = false;

    // 코드를 AST로 파싱
    const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });

    // AST를 탐색하여 사용자 입력을 감지
    walk.simple(ast, {
        MemberExpression(node: any) {
            if (node.property.name === 'query' || node.property.name === 'body' || node.property.name === 'params') {
                const inputString = node.object.name;
                if (!userInputs.includes(inputString)) {
                    userInputs.push(inputString);
                }
            }
        },
        CallExpression(node: any) {
            if (node.callee.type === 'MemberExpression' && node.callee.object.name === 'ldap' && node.callee.property.name === 'search') {
                node.arguments.forEach((arg: any) => {
                    if (arg.type === 'Identifier' && userInputs.includes(arg.name)) {
                        const { start, end } = node.loc;
                        results.push({
                            message: 'Potential LDAP injection vulnerability due to dynamic user input in ldap.search().',
                            startLine: start.line - 1,
                            startCharacter: start.column,
                            endLine: end.line - 1,
                            endCharacter: end.column
                        });
                    }
                });
            } else if (node.callee.type === 'Identifier' && node.callee.name === 'parseFilter') {
                parseFilterFound = true;
            }
        }
    });

    if (parseFilterFound) {
        results.push({
            message: 'parseFilter function usage is missing',
            startLine: 0, // Default values, since parseFilter usage might be across the file
            startCharacter: 0,
            endLine: 0,
            endCharacter: 0
        });
    }

    return results;
}
