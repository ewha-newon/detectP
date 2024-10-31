import OpenAI from 'openai';

// ChatGPT와 통신하여 보안 코딩 권장 사항을 가져오는 함수
export async function getChatGptResponse(code: string): Promise<string> {
    const apiKey =  '';  // OpenAI API 키 설정
    const openai = new OpenAI({
        apiKey: apiKey,
        organization: "org-4sapNkDrgWBnogO56cB5QkCQ",
        project: "proj_yA0N3MDsc6dZHGbKNQLgXl9Z",
    });

    const prompt = `다음은 코드의 일부분이야. 이 코드에 대해서 시큐어 코딩이 적용된 코드를 새로 작성해서 코드만 알려줘:\n\n${code}`;

    // console에 prompt 메세지 출력
    console.log('Sending messages to OpenAI API:', prompt);
    
    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        // max_tokens: 500,
    });

    const fullResponse = response.choices[0].message?.content ?? 'No response';
    console.log('fullResponse: ', fullResponse);

    // 코드 블록만 추출하는 함수를 호출
    return extractCodeBlock(fullResponse);
    // return fullResponse;
    
}


// ChatGPT 응답에서 코드 블록을 추출하는 함수
function extractCodeBlock(response: string): string {
    const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/g;
    let match;
    let codeBlocks = '';

    // 응답 내 모든 코드 블록 추출
    while ((match = codeBlockRegex.exec(response)) !== null) {
        codeBlocks += match[1].trim() + '\n\n'; // 코드 블록만 추출
    }

    // 코드 블록이 없으면 기본 메시지 반환
    return codeBlocks || '코드 블록이 없습니다.';
}