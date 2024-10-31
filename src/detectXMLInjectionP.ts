export function detectXMLInjectionPython(code: string) {
    const issues = [];
    const regex = /(xml\.etree\.ElementTree\.parse|xml\.etree\.ElementTree\.fromstring)\(.*\)/g; // Python의 XML 파싱 함수 탐지

    let match;
    while ((match = regex.exec(code)) !== null) {
        const startPos = match.index;
        const lines = code.substring(0, startPos).split('\n');
        const startLine = lines.length - 1;
        const startCharacter = lines[startLine].length;
        const endCharacter = startCharacter + match[0].length;

        issues.push({
            message: "XML 주입 취약점이 의심됩니다. 사용자 입력을 검증하세요.",
            startLine: startLine,
            startCharacter: startCharacter,
            endLine: startLine,
            endCharacter: endCharacter
        });
    }

    return issues;
}
