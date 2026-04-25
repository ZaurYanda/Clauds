import Anthropic from '@anthropic-ai/sdk';
import type {
  VocabularyData,
  GrammarData,
  ExerciseData,
  CorrectionData,
  ToolResult,
} from './types';

export const SYSTEM_PROMPT = `Ты — дружелюбный и опытный репетитор по арабскому языку для русскоязычных учеников. Твоя цель — обучать арабскому языку в увлекательной и понятной форме.

## Твои возможности:
- Обучение арабскому алфавиту и произношению
- Изучение словарного запаса по темам
- Объяснение грамматики (с примерами)
- Разговорная практика
- Исправление ошибок ученика

## Правила общения:
- Общайся на **русском языке** (основной язык обучения)
- Арабские слова и фразы пиши на арабском скрипте + транслитерация латиницей
- Будь терпеливым и поддерживающим
- Разбивай сложные темы на простые шаги
- Хвали за правильные ответы

## Использование инструментов:
- **show_vocabulary** — когда нужно показать список слов по теме
- **show_grammar** — когда объясняешь грамматическое правило
- **create_exercise** — когда даёшь практические задания
- **correct_text** — когда исправляешь арабский текст ученика

Всегда используй инструменты для структурированного контента (словари, грамматика, упражнения). Текстовые ответы используй для объяснений, приветствий и диалога.

Начни с приветствия и спроси об уровне ученика (начинающий / средний / продвинутый) и что именно он хочет изучать.`;

export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'show_vocabulary',
    description:
      'Показывает структурированную таблицу слов по теме с арабским текстом, транслитерацией и переводом на русский.',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: {
          type: 'string',
          description: 'Тема словарного запаса (например: "Числа", "Цвета", "Еда")',
        },
        entries: {
          type: 'array',
          description: 'Список слов',
          items: {
            type: 'object',
            properties: {
              arabic: { type: 'string', description: 'Слово на арабском' },
              transliteration: { type: 'string', description: 'Транслитерация латиницей' },
              russian: { type: 'string', description: 'Перевод на русский' },
              example: {
                type: 'string',
                description: 'Пример предложения на арабском (опционально)',
              },
            },
            required: ['arabic', 'transliteration', 'russian'],
          },
        },
      },
      required: ['topic', 'entries'],
    },
  },
  {
    name: 'show_grammar',
    description:
      'Показывает объяснение грамматического правила с примерами и таблицами.',
    input_schema: {
      type: 'object' as const,
      properties: {
        topic: { type: 'string', description: 'Название грамматической темы' },
        explanation: { type: 'string', description: 'Объяснение правила на русском' },
        rules: {
          type: 'array',
          description: 'Примеры применения правила',
          items: {
            type: 'object',
            properties: {
              rule: { type: 'string', description: 'Правило или паттерн' },
              arabic_example: { type: 'string', description: 'Пример на арабском' },
              transliteration: { type: 'string', description: 'Транслитерация' },
              russian_translation: { type: 'string', description: 'Перевод на русский' },
            },
            required: ['rule', 'arabic_example', 'transliteration', 'russian_translation'],
          },
        },
      },
      required: ['topic', 'explanation', 'rules'],
    },
  },
  {
    name: 'create_exercise',
    description: 'Создаёт интерактивное упражнение для практики.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['translation', 'fill_blank', 'multiple_choice', 'listening'],
          description: 'Тип упражнения',
        },
        title: { type: 'string', description: 'Название упражнения' },
        questions: {
          type: 'array',
          description: 'Список вопросов',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string', description: 'Текст вопроса или задания' },
              options: {
                type: 'array',
                items: { type: 'string' },
                description: 'Варианты ответов (для multiple_choice)',
              },
              answer: { type: 'string', description: 'Правильный ответ' },
              explanation: { type: 'string', description: 'Объяснение ответа' },
            },
            required: ['question', 'answer', 'explanation'],
          },
        },
      },
      required: ['type', 'title', 'questions'],
    },
  },
  {
    name: 'correct_text',
    description: 'Исправляет арабский текст ученика и объясняет ошибки.',
    input_schema: {
      type: 'object' as const,
      properties: {
        corrections: {
          type: 'array',
          description: 'Список исправлений',
          items: {
            type: 'object',
            properties: {
              original: { type: 'string', description: 'Оригинальный текст с ошибкой' },
              corrected: { type: 'string', description: 'Исправленный текст' },
              explanation: { type: 'string', description: 'Объяснение ошибки на русском' },
            },
            required: ['original', 'corrected', 'explanation'],
          },
        },
        overall_feedback: { type: 'string', description: 'Общая обратная связь на русском' },
      },
      required: ['corrections', 'overall_feedback'],
    },
  },
];

export function processToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): ToolResult {
  switch (toolName) {
    case 'show_vocabulary':
      return { type: 'vocabulary', data: toolInput as unknown as VocabularyData };
    case 'show_grammar':
      return { type: 'grammar', data: toolInput as unknown as GrammarData };
    case 'create_exercise':
      return { type: 'exercise', data: toolInput as unknown as ExerciseData };
    case 'correct_text':
      return { type: 'correction', data: toolInput as unknown as CorrectionData };
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
