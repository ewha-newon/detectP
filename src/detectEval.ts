import * as acorn from "acorn";
import * as walk from "acorn-walk";

export function detectEval(code: string): { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] {
    const results: { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] = [];
    
    // 코드를 AST로 파싱
    const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });

    // AST를 탐색하여 eval 사용을 감지
    walk.simple(ast, {
        CallExpression(node: any) {
            if (node.callee.name === 'eval') {
                const { start, end } = node.loc;
                results.push({
                    message: 'eval() 사용은 보안 취약점이 될 수 있습니다.',
                    startLine: start.line - 1,  // VS Code는 0-based index를 사용하므로 -1
                    startCharacter: start.column,
                    endLine: end.line - 1,
                    endCharacter: end.column
                });
            }
        }
    });

    return results;
}
