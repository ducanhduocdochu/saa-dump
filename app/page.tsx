"use client";

import { useEffect, useState } from "react";

type Question = {
  questionNumber: string;
  question: string;
  answers: string[];
  mostVoted: string[];
};

const STORAGE_KEY = "aws_quiz_progress_v1";

export default function QuizPage() {
  const [mounted, setMounted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [showResult, setShowResult] = useState(false);

  // ⬇️ Export localStorage → file JSON
const handleExport = () => {
  const data = localStorage.getItem(STORAGE_KEY) || "{}";

  const blob = new Blob([data], {
    type: "application/json",
  });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "aws_quiz_progress.json";
  a.click();
};

// ⬆️ Import file JSON → localStorage
const handleImport = (file: File) => {
  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const parsed = JSON.parse(e.target?.result as string);

      setSelected(parsed);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(parsed, null, 2)
      );

      alert("Import thành công!");
    } catch (err) {
      alert("File JSON không hợp lệ");
    }
  };

  reader.readAsText(file);
};


  // 🔑 chỉ render sau khi client mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load questions
  useEffect(() => {
    if (!mounted) return;

    fetch("/aws_questions_final.json")
      .then((res) => res.json())
      .then(setQuestions)
      .catch(console.error);
  }, [mounted]);

  // 🔄 Load answers từ localStorage
  useEffect(() => {
    if (!mounted) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSelected(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved answers", e);
      }
    }
  }, [mounted]);

  if (!mounted) return null;

  if (!questions.length) {
    return (
      <p className="text-center mt-20 text-slate-500">
        Loading questions…
      </p>
    );
  }

  const q = questions[current];
  const picked = selected[q.questionNumber] || [];
  const isDone = picked.length > 0;

  const toggle = (a: string) => {
    setSelected((prev) => {
      const arr = prev[q.questionNumber] || [];
      return {
        ...prev,
        [q.questionNumber]: arr.includes(a)
          ? arr.filter((x) => x !== a)
          : [...arr, a],
      };
    });
  };

  // 💾 Check + lưu localStorage
  const handleCheck = () => {
    setShowResult(true);

    const updated = {
      ...selected,
      [q.questionNumber]: picked,
    };

    setSelected(updated);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated, null, 2)
    );
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">
        AWS Practice Quiz
      </h1>

      {/* Card */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="mb-4 text-sm text-slate-500 flex justify-between">
          <span>
            Question {current + 1} / {questions.length}
          </span>

          {isDone && (
            <span className="text-green-600 font-medium">
              ✓ Done
            </span>
          )}
        </div>

        <h2 className="text-black text-lg font-semibold mb-4">
          {q.question}
        </h2>

        <div className="space-y-3">
          {q.answers.map((a) => {
            const isChecked = picked.includes(a);
            const isCorrect = q.mostVoted.includes(a);

            let style =
              "border border-slate-200 hover:border-slate-400";

            if (showResult && isCorrect)
              style = "border-green-500 bg-green-50";
            else if (showResult && isChecked)
              style = "border-red-500 bg-red-50";

            return (
              <label
                key={a}
                className={`text-black flex items-start gap-3 p-3 rounded-lg cursor-pointer transition ${style}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(a)}
                  className="mt-1"
                />
                <span>{a}</span>
              </label>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            disabled={picked.length === 0}
            onClick={handleCheck}
            className={`px-4 py-2 rounded text-white
              ${picked.length === 0
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"}`}
          >
            Check Answer
          </button>

          <button
            onClick={() => {
              setShowResult(false);
              setCurrent((c) =>
                Math.min(c + 1, questions.length - 1)
              );
            }}
            className="text-black px-4 py-2 bg-slate-200 rounded hover:bg-slate-300"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Footer */}
<div className="flex justify-between mt-6">
  <button
    onClick={() => {
      setShowResult(false);
      setCurrent((c) => Math.max(c - 1, 0));
    }}
    className="text-sm text-slate-600 hover:underline"
  >
    ← Previous
  </button>

  <div className="flex gap-4">
    <button
      onClick={handleExport}
      className="text-sm text-blue-600 hover:underline"
    >
      ⬇️ Download progress
    </button>

    <button
      onClick={() =>
        document.getElementById("import-file")?.click()
      }
      className="text-sm text-green-600 hover:underline"
    >
      ⬆️ Import progress
    </button>
  </div>
</div>

      <input
  type="file"
  accept="application/json"
  id="import-file"
  hidden
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) handleImport(file);
    e.target.value = ""; // reset input
  }}
/>


    </main>
  );
}
