"""
Arabic Language Tutor Agent — Агент для изучения арабского языка
وكيل تعلم اللغة العربية

Uses Claude claude-sonnet-4-6 with prompt caching and tool use for structured lessons.
"""

import anthropic

MODEL = "claude-sonnet-4-6"
client = anthropic.Anthropic()

SYSTEM_PROMPT = """Ты — опытный преподаватель арабского языка. Ты помогаешь русскоязычным студентам изучать арабский язык (Современный стандартный арабский и диалекты).

أنا مدرس اللغة العربية المتخصص في مساعدة الطلاب الناطقين بالروسية.

## Твои возможности:
- Обучать арабскому алфавиту و (حروف هجاء) и произношению (نطق)
- Давать уроки словарного запаса (مفردات) с транслитерацией
- Объяснять грамматику (قواعد): падежи, глаголы, местоимения, числа
- Проводить разговорные упражнения и диалоги (محادثة)
- Исправлять ошибки студентов с объяснениями
- Переводить между русским и арабским языками
- Рассказывать о культуре арабоязычных стран

## Правила общения:
1. Отвечай СНАЧАЛА на русском, ключевые арабские фразы дублируй в скобках
2. Арабские слова всегда сопровождай транслитерацией: **مرحبا** (marhaba)
3. Используй инструменты для структурированных материалов:
   - get_vocabulary_list → таблицы слов по темам
   - get_grammar_table → грамматические таблицы
   - create_exercise → упражнения для практики
   - correct_arabic_text → разбор ошибок студента
4. Будь терпелив, поддерживай студента, хвали за успехи
5. Адаптируй сложность под уровень студента
6. Когда студент пишет по-арабски — всегда используй correct_arabic_text для проверки

## Структура урока (по желанию студента):
- Алфавит → Базовые фразы → Числа → Семья → Еда → Путешествия → Грамматика → Разговор

Приветствуй студента тепло на обоих языках и узнай, что он хочет изучить."""

TOOLS = [
    {
        "name": "get_vocabulary_list",
        "description": (
            "Создать структурированную таблицу слов по теме для урока словарного запаса. "
            "Вызывай этот инструмент когда нужно показать список слов по теме."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "topic": {
                    "type": "string",
                    "description": "Тема (например: 'числа 1-10', 'приветствия', 'семья', 'еда', 'цвета', 'дни недели')"
                },
                "level": {
                    "type": "string",
                    "enum": ["beginner", "intermediate", "advanced"],
                    "description": "Уровень сложности студента"
                },
                "words": {
                    "type": "array",
                    "description": "Список слов для урока",
                    "items": {
                        "type": "object",
                        "properties": {
                            "arabic": {"type": "string", "description": "Слово на арабском"},
                            "transliteration": {"type": "string", "description": "Транслитерация латиницей"},
                            "russian": {"type": "string", "description": "Перевод на русский"},
                            "example_ar": {"type": "string", "description": "Пример предложения на арабском (опционально)"},
                            "example_ru": {"type": "string", "description": "Перевод примера (опционально)"}
                        },
                        "required": ["arabic", "transliteration", "russian"]
                    }
                }
            },
            "required": ["topic", "level", "words"]
        }
    },
    {
        "name": "get_grammar_table",
        "description": (
            "Создать таблицу для объяснения грамматического правила. "
            "Вызывай когда объясняешь грамматику: местоимения, глаголы, падежи, числа и т.д."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "grammar_topic": {
                    "type": "string",
                    "description": "Тема (например: 'Личные местоимения', 'Глагол كتب в прошедшем времени', 'Определённый артикль ال')"
                },
                "explanation_ru": {
                    "type": "string",
                    "description": "Объяснение правила на русском языке"
                },
                "explanation_ar": {
                    "type": "string",
                    "description": "Объяснение на арабском (опционально)"
                },
                "columns": {
                    "type": "array",
                    "description": "Названия столбцов таблицы",
                    "items": {"type": "string"}
                },
                "rows": {
                    "type": "array",
                    "description": "Строки таблицы",
                    "items": {
                        "type": "object",
                        "properties": {
                            "label": {"type": "string", "description": "Метка строки (например: 'я / أنا')"},
                            "arabic": {"type": "string", "description": "Арабская форма"},
                            "transliteration": {"type": "string", "description": "Транслитерация"},
                            "russian": {"type": "string", "description": "Русское объяснение/перевод"},
                            "note": {"type": "string", "description": "Дополнительное примечание (опционально)"}
                        },
                        "required": ["label", "arabic", "transliteration", "russian"]
                    }
                }
            },
            "required": ["grammar_topic", "explanation_ru", "rows"]
        }
    },
    {
        "name": "create_exercise",
        "description": (
            "Создать упражнение для практики. "
            "Вызывай когда хочешь проверить знания или дать задание для тренировки."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "exercise_type": {
                    "type": "string",
                    "enum": [
                        "translate_ru_to_ar",
                        "translate_ar_to_ru",
                        "fill_in_blank",
                        "match_pairs",
                        "write_arabic"
                    ],
                    "description": "Тип упражнения"
                },
                "title": {
                    "type": "string",
                    "description": "Название упражнения на русском"
                },
                "instructions": {
                    "type": "string",
                    "description": "Инструкции на русском языке"
                },
                "questions": {
                    "type": "array",
                    "description": "Задания упражнения",
                    "items": {
                        "type": "object",
                        "properties": {
                            "question": {"type": "string", "description": "Задание/вопрос"},
                            "answer": {"type": "string", "description": "Правильный ответ"},
                            "hint": {"type": "string", "description": "Подсказка (опционально)"}
                        },
                        "required": ["question", "answer"]
                    }
                }
            },
            "required": ["exercise_type", "title", "instructions", "questions"]
        }
    },
    {
        "name": "correct_arabic_text",
        "description": (
            "Проверить и исправить арабский текст студента. "
            "ВСЕГДА вызывай этот инструмент когда студент пишет что-то на арабском — "
            "даже если кажется, что всё правильно."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "original": {
                    "type": "string",
                    "description": "Исходный текст студента"
                },
                "corrected": {
                    "type": "string",
                    "description": "Правильный вариант"
                },
                "has_errors": {
                    "type": "boolean",
                    "description": "Есть ли ошибки в тексте"
                },
                "corrections": {
                    "type": "array",
                    "description": "Список ошибок (пустой если ошибок нет)",
                    "items": {
                        "type": "object",
                        "properties": {
                            "wrong": {"type": "string", "description": "Неправильный вариант"},
                            "correct": {"type": "string", "description": "Правильный вариант"},
                            "rule": {"type": "string", "description": "Правило/объяснение на русском"}
                        },
                        "required": ["wrong", "correct", "rule"]
                    }
                },
                "feedback": {
                    "type": "string",
                    "description": "Общий отзыв и похвала на русском языке"
                }
            },
            "required": ["original", "corrected", "has_errors", "corrections", "feedback"],
            "cache_control": {"type": "ephemeral"}
        }
    }
]

# Add cache_control to last tool so tools + system are cached together
TOOLS[-1] = {**TOOLS[-1], "cache_control": {"type": "ephemeral"}}


# ── Formatters ──────────────────────────────────────────────────────────────

def fmt_vocabulary(data: dict) -> str:
    level_ru = {"beginner": "Начальный", "intermediate": "Средний", "advanced": "Продвинутый"}
    level = level_ru.get(data.get("level", "beginner"), "Начальный")
    topic = data.get("topic", "")

    lines = [
        "",
        f"📚 Словарь: {topic}  |  مفردات: {topic}",
        f"   Уровень: {level}",
        "─" * 58,
        f"  {'Арабский':<18} {'Произношение':<18} {'Перевод'}",
        "─" * 58,
    ]
    for w in data.get("words", []):
        lines.append(f"  {w.get('arabic',''):<18} {w.get('transliteration',''):<18} {w.get('russian','')}")
        if w.get("example_ar"):
            lines.append(f"    ✦ {w['example_ar']}")
        if w.get("example_ru"):
            lines.append(f"      → {w['example_ru']}")
    lines.append("─" * 58)
    return "\n".join(lines)


def fmt_grammar(data: dict) -> str:
    topic = data.get("grammar_topic", "")
    lines = [
        "",
        f"📖 Грамматика: {topic}",
        "",
        data.get("explanation_ru", ""),
    ]
    if data.get("explanation_ar"):
        lines.append(data["explanation_ar"])
    lines += ["", "─" * 58]

    cols = data.get("columns") or ["Категория", "Арабский", "Произношение", "Перевод"]
    header = "  " + "  ".join(f"{c:<14}" for c in cols)
    lines.append(header)
    lines.append("─" * 58)

    for row in data.get("rows", []):
        cells = [
            row.get("label", ""),
            row.get("arabic", ""),
            row.get("transliteration", ""),
            row.get("russian", ""),
        ]
        lines.append("  " + "  ".join(f"{c:<14}" for c in cells))
        if row.get("note"):
            lines.append(f"    💡 {row['note']}")
    lines.append("─" * 58)
    return "\n".join(lines)


def fmt_exercise(data: dict) -> str:
    type_labels = {
        "translate_ru_to_ar": "Переводи с русского на арабский",
        "translate_ar_to_ru": "Переводи с арабского на русский",
        "fill_in_blank": "Заполни пропуски",
        "match_pairs": "Соедини пары",
        "write_arabic": "Напиши по-арабски",
    }
    etype = type_labels.get(data.get("exercise_type", ""), "Упражнение")
    lines = [
        "",
        f"✏️  {data.get('title', 'Упражнение')}  [{etype}]",
        f"   {data.get('instructions', '')}",
        "",
    ]
    for i, q in enumerate(data.get("questions", []), 1):
        lines.append(f"  {i}. {q.get('question', '')}")
        if q.get("hint"):
            lines.append(f"     💡 Подсказка: {q['hint']}")
    lines.append("")
    lines.append("  _(Напиши ответы, и я проверю!)_")
    # Stash answers in a hidden section the model will use for checking
    lines.append("\n~~ANSWERS~~")
    for i, q in enumerate(data.get("questions", []), 1):
        lines.append(f"  {i}. {q.get('answer', '')}")
    return "\n".join(lines)


def fmt_correction(data: dict) -> str:
    lines = ["", "🔍 Проверка твоего текста  |  تصحيح النص", ""]
    lines.append(f"  Твой текст:    {data.get('original', '')}")
    lines.append(f"  Правильно:     {data.get('corrected', '')}")

    corrections = data.get("corrections", [])
    if not data.get("has_errors") or not corrections:
        lines.append("\n  ✅ Всё верно! Отличная работа!")
    else:
        lines.append("\n  Ошибки:")
        for c in corrections:
            lines.append(f"    ❌ {c.get('wrong','')}  →  ✅ {c.get('correct','')}")
            lines.append(f"       📝 {c.get('rule','')}")

    if data.get("feedback"):
        lines.append(f"\n  {data['feedback']}")
    return "\n".join(lines)


def process_tool(name: str, tool_input: dict) -> str:
    dispatch = {
        "get_vocabulary_list": fmt_vocabulary,
        "get_grammar_table": fmt_grammar,
        "create_exercise": fmt_exercise,
        "correct_arabic_text": fmt_correction,
    }
    fn = dispatch.get(name)
    return fn(tool_input) if fn else f"[Инструмент {name} выполнен]"


# ── Conversation loop ────────────────────────────────────────────────────────

def chat(messages: list, user_text: str) -> tuple[str, list]:
    """Send user_text, run tool loop, return final assistant text + updated messages."""
    messages.append({"role": "user", "content": user_text})

    while True:
        response = client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            tools=TOOLS,
            messages=messages,
        )

        if response.stop_reason == "tool_use":
            messages.append({"role": "assistant", "content": response.content})
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    formatted = process_tool(block.name, block.input)
                    print(formatted)
                    tool_results.append(
                        {
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": formatted,
                        }
                    )
            messages.append({"role": "user", "content": tool_results})

        elif response.stop_reason == "end_turn":
            text = "".join(b.text for b in response.content if hasattr(b, "text"))
            messages.append({"role": "assistant", "content": response.content})

            usage = response.usage
            cached = getattr(usage, "cache_read_input_tokens", 0) or 0
            if cached:
                print(f"\n  [💾 кэш: {cached} токенов сохранено]", end="")

            return text, messages

        else:
            return "Произошла ошибка. / حدث خطأ.", messages


# ── UI helpers ───────────────────────────────────────────────────────────────

DIVIDER = "─" * 60

def print_banner():
    print("\n" + "=" * 60)
    print("  🌙 Агент по изучению арабского языка")
    print("      وكيل تعلم اللغة العربية")
    print("=" * 60)
    print("  Команды:")
    print("    выход / exit   — завершить сеанс")
    print("    новый / new    — начать заново")
    print(DIVIDER + "\n")


# ── Entry point ──────────────────────────────────────────────────────────────

def main():
    print_banner()

    messages: list = []

    # Initial greeting
    greeting, messages = chat(
        messages,
        "Привет! Я начинаю изучать арабский язык. Поприветствуй меня и расскажи, как ты можешь помочь.",
    )
    print(f"Агент: {greeting}\n")

    while True:
        try:
            user_input = input("Вы: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nДо свидания! مع السلامة 👋\n")
            break

        if not user_input:
            continue

        cmd = user_input.lower()
        if cmd in ("выход", "exit", "quit", "خروج"):
            print("\nДо свидания! مع السلامة 👋\n")
            break

        if cmd in ("новый", "new", "reset", "جديد"):
            messages = []
            print(f"\n{DIVIDER}")
            print("🔄 Начинаем заново / بداية جديدة\n")
            greeting, messages = chat(
                messages,
                "Привет! Начнём урок арабского языка заново.",
            )
            print(f"Агент: {greeting}\n")
            continue

        print()
        reply, messages = chat(messages, user_input)
        print(f"Агент: {reply}\n")


if __name__ == "__main__":
    main()
