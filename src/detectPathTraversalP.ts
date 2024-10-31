export function detectPathTraversalPython(code: string) {
    const issues = [];
    const regex = /(os\.path\.(join|abspath)\(.*\))/g; // os.path.join() 또는 os.path.abspath() 탐지

    let match;
    while ((match = regex.exec(code)) !== null) {
        const startPos = match.index;
        const lines = code.substring(0, startPos).split('\n');
        const startLine = lines.length - 1; // 코드가 몇 번째 줄인지 계산
        const startCharacter = lines[lines.length - 1].length; // 해당 줄의 시작 문자 위치 계산
        const endCharacter = startCharacter + match[0].length; // 끝 문자 위치 계산

        issues.push({
            message: "경로 조작 취약점이 의심됩니다. 사용자 입력을 검증하세요.",
            startLine: startLine,
            startCharacter: startCharacter,
            endLine: startLine,
            endCharacter: endCharacter
        });
    }

    return issues;
}
