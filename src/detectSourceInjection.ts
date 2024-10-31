import * as acorn from "acorn";
import * as walk from "acorn-walk";

export function detectSourceInjection(code: string): { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] {
    const userInputs: string[] = [];
    const results: { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] = [];

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
            const regex = /\bio\s*\(/;
            if (node.callee.type === 'Identifier' && regex.test(node.callee.name)) {
                node.arguments.forEach((arg: any) => {
                    if (arg.type === 'Identifier' && userInputs.includes(arg.name)) {
                        const { start, end } = node.loc;
                        results.push({
                            message: 'Potential source injection vulnerability due to dynamic user input in the "io" function call.',
                            startLine: start.line - 1,
                            startCharacter: start.column,
                            endLine: end.line - 1,
                            endCharacter: end.column
                        });
                    }
                });
            }
        }
    });

    return results;
}
