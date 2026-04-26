import { SchemaType } from '@google/generative-ai';
import type { Tool } from '@google/generative-ai';
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

export const GEMINI_TOOLS: Tool[] = [
  {
    functionDeclarations: [
      {
        name: 'show_vocabulary',
        description:
          'Показывает структурированную таблицу слов по теме с арабским текстом, транслитерацией и переводом на русский.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            topic: {
              type: SchemaType.STRING,
              description: 'Тема словарного запаса (например: "Числа", "Цвета", "Еда")',
            },
            entries: {
              type: SchemaType.ARRAY,
              description: 'Список слов',
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  arabic: { type: SchemaType.STRING, description: 'Слово на арабском' },
                  transliteration: { type: SchemaType.STRING, description: 'Транслитерация латиницей' },
                  russian: { type: SchemaType.STRING, description: 'Перевод на русский' },
                  example: { type: SchemaType.STRING, description: 'Пример предложения (опционально)' },
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
        description: 'Показывает объяснение грамматического правила с примерами и таблицами.',
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            topic: { type: SchemaType.STRING, description: 'Название грамматической темы' },
            explanation: { type: SchemaType.STRING, description: 'Объяснение правила на русском' },
            rules: {
              type: SchemaType.ARRAY,
              description: 'Примеры применения правила',
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  rule: { type: SchemaType.STRING, description: 'Правило или паттерн' },
                  arabic_example: { type: SchemaType.STRING, description: 'Пример на арабском' },
                  transliteration: { type: SchemaType.STRING, description: 'Транслитерация' },
                  russian_translation: { type: SchemaType.STRING, description: 'Перевод на русский' },
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
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            type: {
              type: SchemaType.STRING,
              description: 'Тип упражнения: translation, fill_blank, multiple_choice, listening',
            },
            title: { type: SchemaType.STRING, description: 'Название упражнения' },
            questions: {
              type: SchemaType.ARRAY,
              description: 'Список вопросов',
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  question: { type: SchemaType.STRING, description: 'Текст вопроса или задания' },
                  options: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: 'Варианты ответов (для multiple_choice)',
                  },
                  answer: { type: SchemaType.STRING, description: 'Правильный ответ' },
                  explanation: { type: SchemaType.STRING, description: 'Объяснение ответа' },
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
        parameters: {
          type: SchemaType.OBJECT,
          properties: {
            corrections: {
              type: SchemaType.ARRAY,
              description: 'Список исправлений',
              items: {
                type: SchemaType.OBJECT,
                properties: {
                  original: { type: SchemaType.STRING, description: 'Оригинальный текст с ошибкой' },
                  corrected: { type: SchemaType.STRING, description: 'Исправленный текст' },
                  explanation: { type: SchemaType.STRING, description: 'Объяснение ошибки на русском' },
                },
                required: ['original', 'corrected', 'explanation'],
              },
            },
            overall_feedback: { type: SchemaType.STRING, description: 'Общая обратная связь на русском' },
          },
          required: ['corrections', 'overall_feedback'],
        },
      },
    ],
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
