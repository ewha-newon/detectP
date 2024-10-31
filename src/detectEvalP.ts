export function detectEvalPython(code: string) {
    const issues = [];
    const regex = /\beval\s*\(/g; // Python의 eval() 함수 탐지

    let match;
    while ((match = regex.exec(code)) !== null) {
        const startPos = match.index;
        const endPos = regex.lastIndex;
        const lines = code.substring(0, startPos).split('\n');
        const startLine = lines.length - 1;
        const startCharacter = lines[startLine].length;
        const endCharacter = startCharacter + match[0].length;

        issues.push({
            message: "eval() 함수 사용을 피하십시오. 보안 위험이 있습니다.",
            startLine: startLine,
            startCharacter: startCharacter,
            endLine: startLine,
            endCharacter: endCharacter
        });
    }

    return issues;
}
