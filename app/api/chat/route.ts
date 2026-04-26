import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Content } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, GEMINI_TOOLS, processToolCall } from '@/lib/agent';
import type { ToolResult } from '@/lib/types';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { history, newMessage } = (await req.json()) as {
      history: Content[];
      newMessage: string;
    };

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
      tools: GEMINI_TOOLS,
    });

    const chat = model.startChat({ history });

    const toolResults: ToolResult[] = [];
    let responseText = '';
    let iterations = 0;

    let result = await chat.sendMessage(newMessage);

    // Agentic loop
    while (iterations < 10) {
      iterations++;
      const functionCalls = result.response.functionCalls();

      if (functionCalls && functionCalls.length > 0) {
        const responseParts = functionCalls.map((call) => {
          const toolResult = processToolCall(
            call.name,
            call.args as Record<string, unknown>
          );
          toolResults.push(toolResult);
          return {
            functionResponse: {
              name: call.name,
              response: { result: toolResult.data },
            },
          };
        });

        result = await chat.sendMessage(responseParts);
      } else {
        responseText = result.response.text();
        break;
      }
    }

    const updatedHistory = await chat.getHistory();

    return NextResponse.json({
      text: responseText,
      toolResults,
      history: updatedHistory,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Ошибка при обработке запроса' },
      { status: 500 }
    );
  }
}
