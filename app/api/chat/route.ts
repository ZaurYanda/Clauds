import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { SYSTEM_PROMPT, TOOLS, processToolCall } from '@/lib/agent';
import type { ToolResult } from '@/lib/types';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { history, newMessage } = (await req.json()) as {
      history: Anthropic.MessageParam[];
      newMessage: string;
    };

    const messages: Anthropic.MessageParam[] = [
      ...history,
      { role: 'user', content: newMessage },
    ];

    const toolResults: ToolResult[] = [];
    let responseText = '';
    let cachedTokens = 0;

    // Agentic loop
    while (true) {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: [
          {
            type: 'text',
            text: SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
        tools: TOOLS.map((tool, index) =>
          index === TOOLS.length - 1
            ? { ...tool, cache_control: { type: 'ephemeral' as const } }
            : tool
        ),
        messages,
      });

      if (response.usage) {
        cachedTokens = response.usage.cache_read_input_tokens ?? 0;
      }

      if (response.stop_reason === 'tool_use') {
        const assistantContent = response.content;
        messages.push({ role: 'assistant', content: assistantContent });

        const toolResultContent: Anthropic.ToolResultBlockParam[] = [];

        for (const block of assistantContent) {
          if (block.type === 'text' && block.text) {
            responseText += block.text;
          } else if (block.type === 'tool_use') {
            const result = processToolCall(
              block.name,
              block.input as Record<string, unknown>
            );
            toolResults.push(result);
            toolResultContent.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result.data),
            });
          }
        }

        messages.push({ role: 'user', content: toolResultContent });
      } else {
        // end_turn
        for (const block of response.content) {
          if (block.type === 'text') {
            responseText += block.text;
          }
        }
        messages.push({ role: 'assistant', content: response.content });
        break;
      }
    }

    return NextResponse.json({
      text: responseText,
      toolResults,
      history: messages,
      cachedTokens,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Ошибка при обработке запроса' },
      { status: 500 }
    );
  }
}
