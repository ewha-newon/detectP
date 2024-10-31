import * as acorn from "acorn";
import * as walk from "acorn-walk";

export function detectXMLInjection(code: string): { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] {
    const results: { message: string, startLine: number, startCharacter: number, endLine: number, endCharacter: number }[] = [];

    // 코드를 AST로 파싱
    const ast = acorn.parse(code, { ecmaVersion: 2020, locations: true });

    // AST를 탐색하여 xpath 관련 호출을 감지
    walk.simple(ast, {
        CallExpression(node: any) {
            // xpath.select() 호출 감지
            if (node.callee.type === 'MemberExpression' && node.callee.object.name === 'xpath' && node.callee.property.name === 'select') {
                const arg = node.arguments[0];  // 첫 번째 인자
                
                // 템플릿 리터럴을 사용한 동적 XPath 탐지
                if (arg.type === 'TemplateLiteral') {
                    const { start, end } = node.loc;
                    const message = 'Potential XML Injection vulnerability due to dynamic XPath expression using template literals in xpath.select().';
                    results.push({
                        message,
                        startLine: start.line - 1,
                        startCharacter: start.column,
                        endLine: end.line - 1,
                        endCharacter: end.column
                    });
                }
            }
        }
    });

    return results;
}
