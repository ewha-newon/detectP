import * as acorn from "acorn";
import * as walk from "acorn-walk";

export function detectPathTraversal(code: string): { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] {
    const lines = code.split('\n');
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
            if ((node.callee.type === 'MemberExpression' && node.callee.object.name === 'path' && (node.callee.property.name === 'resolve' || node.callee.property.name === 'join')) ||
                (node.callee.type === 'Identifier' && (node.callee.name === 'resolve' || node.callee.name === 'join'))) {
                node.arguments.forEach((arg: any) => {
                    if (arg.type === 'Identifier' && userInputs.includes(arg.name)) {
                        const { start, end } = node.loc;
                        results.push({
                            message: 'Potential path traversal vulnerability due to dynamic user input in path.resolve() or path.join().',
                            startLine: start.line - 1,  // VS Code는 0-based index를 사용하므로 -1
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
