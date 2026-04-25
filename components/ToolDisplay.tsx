'use client';

import { useState } from 'react';
import type {
  ToolResult,
  VocabularyData,
  GrammarData,
  ExerciseData,
  CorrectionData,
} from '@/lib/types';

function VocabularyCard({ data }: { data: VocabularyData }) {
  return (
    <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-sm">
      <div className="bg-amber-500 px-4 py-2.5">
        <h3 className="text-white font-semibold text-sm">Словарь: {data.topic}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-amber-50 border-b border-amber-100">
              <th className="text-right px-4 py-2.5 text-amber-800 font-medium font-arabic text-base">
                عربي
              </th>
              <th className="text-left px-4 py-2.5 text-amber-800 font-medium">
                Транслитерация
              </th>
              <th className="text-left px-4 py-2.5 text-amber-800 font-medium">Русский</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((entry, i) => (
              <tr
                key={i}
                className="border-b border-gray-50 hover:bg-amber-50/50 transition-colors"
              >
                <td className="text-right px-4 py-3 font-arabic text-xl text-gray-900">
                  {entry.arabic}
                </td>
                <td className="px-4 py-3 text-gray-600 italic">{entry.transliteration}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">{entry.russian}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.entries.some((e) => e.example) && (
        <div className="px-4 py-3 bg-amber-50/50 border-t border-amber-100">
          <p className="text-xs text-amber-700 font-medium mb-2">Примеры:</p>
          {data.entries
            .filter((e) => e.example)
            .map((entry, i) => (
              <div key={i} className="mb-1">
                <span className="font-arabic text-base ml-2" dir="rtl">
                  {entry.example}
                </span>
                <span className="text-gray-500 text-xs">({entry.russian})</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function GrammarCard({ data }: { data: GrammarData }) {
  return (
    <div className="bg-white rounded-2xl border border-blue-200 overflow-hidden shadow-sm">
      <div className="bg-blue-500 px-4 py-2.5">
        <h3 className="text-white font-semibold text-sm">Грамматика: {data.topic}</h3>
      </div>
      <div className="px-4 py-3">
        <p className="text-gray-700 text-sm mb-3">{data.explanation}</p>
        <div className="space-y-2">
          {data.rules.map((rule, i) => (
            <div key={i} className="bg-blue-50 rounded-xl p-3">
              <p className="text-blue-800 font-medium text-xs mb-2">{rule.rule}</p>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="font-arabic text-xl text-gray-900" dir="rtl">
                  {rule.arabic_example}
                </span>
                <span className="text-gray-500 text-sm italic">{rule.transliteration}</span>
                <span className="text-gray-700 text-sm">{rule.russian_translation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExerciseCard({ data }: { data: ExerciseData }) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const typeLabels: Record<string, string> = {
    translation: 'Перевод',
    fill_blank: 'Заполни пропуск',
    multiple_choice: 'Выбор ответа',
    listening: 'На слух',
  };

  return (
    <div className="bg-white rounded-2xl border border-green-200 overflow-hidden shadow-sm">
      <div className="bg-green-500 px-4 py-2.5 flex justify-between items-center">
        <h3 className="text-white font-semibold text-sm">{data.title}</h3>
        <span className="text-green-100 text-xs bg-green-600 px-2 py-0.5 rounded-full">
          {typeLabels[data.type] ?? data.type}
        </span>
      </div>
      <div className="px-4 py-3 space-y-3">
        {data.questions.map((q, i) => (
          <div key={i} className="border border-gray-100 rounded-xl p-3">
            <p className="text-gray-800 text-sm font-medium mb-2">
              {i + 1}. {q.question}
            </p>
            {q.options && (
              <ul className="space-y-1 mb-2">
                {q.options.map((opt, j) => (
                  <li key={j} className="text-sm text-gray-600 flex gap-2">
                    <span className="text-gray-400">{String.fromCharCode(1072 + j)})</span>
                    {opt}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={() => toggle(i)}
              className="text-xs text-green-600 hover:text-green-700 font-medium transition-colors"
            >
              {revealed.has(i) ? 'Скрыть ответ' : 'Показать ответ'}
            </button>
            {revealed.has(i) && (
              <div className="mt-2 bg-green-50 rounded-lg p-2.5">
                <p className="text-green-800 text-sm font-medium">
                  Ответ:{' '}
                  <span className="font-arabic text-base" dir="rtl">
                    {q.answer}
                  </span>
                </p>
                <p className="text-green-700 text-xs mt-1">{q.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CorrectionCard({ data }: { data: CorrectionData }) {
  return (
    <div className="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-sm">
      <div className="bg-red-500 px-4 py-2.5">
        <h3 className="text-white font-semibold text-sm">Исправление текста</h3>
      </div>
      <div className="px-4 py-3 space-y-2">
        {data.corrections.map((c, i) => (
          <div key={i} className="bg-red-50 rounded-xl p-3">
            <div className="flex gap-3 items-center flex-wrap mb-1">
              <span className="line-through text-red-400 font-arabic text-lg" dir="rtl">
                {c.original}
              </span>
              <span className="text-gray-400">→</span>
              <span className="text-green-700 font-arabic text-lg font-medium" dir="rtl">
                {c.corrected}
              </span>
            </div>
            <p className="text-gray-600 text-xs">{c.explanation}</p>
          </div>
        ))}
        <div className="bg-amber-50 rounded-xl p-3 mt-2">
          <p className="text-amber-800 text-sm">{data.overall_feedback}</p>
        </div>
      </div>
    </div>
  );
}

export default function ToolDisplay({ results }: { results: ToolResult[] }) {
  if (!results.length) return null;

  return (
    <div className="space-y-3 mt-3">
      {results.map((result, i) => {
        switch (result.type) {
          case 'vocabulary':
            return <VocabularyCard key={i} data={result.data} />;
          case 'grammar':
            return <GrammarCard key={i} data={result.data} />;
          case 'exercise':
            return <ExerciseCard key={i} data={result.data} />;
          case 'correction':
            return <CorrectionCard key={i} data={result.data} />;
        }
      })}
    </div>
  );
}
