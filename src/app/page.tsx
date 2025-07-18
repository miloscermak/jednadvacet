"use client";
import { useState } from "react";

export default function DvacetJednaOtazek() {
  const [questions, setQuestions] = useState([
    { text: "Ahoj! Mysli si nějakou všeobecně známou celebritu a odpovídej na mé otázky. Začínám: Je tato celebrita naživu?", answer: null },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [summary, setSummary] = useState(null);

  async function sendAnswer(answer) {
    setIsLoading(true);
    const updatedQuestions = [...questions];
    updatedQuestions[updatedQuestions.length - 1].answer = answer;
    setQuestions(updatedQuestions);

    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: updatedQuestions }),
    });
    const data = await res.json();

    if (data.type === "question") {
      setQuestions([...updatedQuestions, { text: data.text, answer: null }]);
    } else if (data.type === "guess" || data.type === "end") {
      setGameOver(true);
      setSummary(data.summary || data.text);
    }
    setIsLoading(false);
  }

  function AnswerButtons() {
    if (gameOver) return null;
    if (isLoading)
      return (
        <div className="mt-4 text-lg text-gray-500">Přemýšlím…</div>
      );
    return (
      <div className="flex gap-4 mt-6 justify-center">
        <button onClick={() => sendAnswer("ANO")} className="px-6 py-2 rounded-2xl shadow bg-green-100 hover:bg-green-200 text-green-800 font-bold text-lg transition-all">ANO</button>
        <button onClick={() => sendAnswer("NE")} className="px-6 py-2 rounded-2xl shadow bg-red-100 hover:bg-red-200 text-red-800 font-bold text-lg transition-all">NE</button>
        <button onClick={() => sendAnswer("NEVÍM / NEDÁ SE ŘÍCT")} className="px-6 py-2 rounded-2xl shadow bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-all">NEVÍM / NEDÁ SE ŘÍCT</button>
      </div>
    );
  }

  function History() {
    return (
      <div className="my-6">
        {questions.map((q, i) => (
          <div key={i} className="mb-2 flex items-center">
            <span className="font-semibold text-blue-800 mr-2">{i + 1}.</span>
            <span className="mr-2">{q.text}</span>
            {q.answer && (
              <span className="ml-4 rounded-full px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 text-sm">
                {q.answer}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-100 flex flex-col items-center py-8 px-2">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 mt-6">
        <h1 className="text-3xl font-extrabold text-center text-blue-900 mb-3">21 otázek: Uhodni celebritu!</h1>
        <History />
        {!gameOver && (
          <div className="text-center text-lg font-semibold mt-4">
            {questions[questions.length - 1].answer == null
              ? "Jak odpovíš?"
              : null}
          </div>
        )}
        <AnswerButtons />
        {gameOver && (
          <div className="mt-8 p-4 rounded-xl bg-green-50 text-green-900 shadow text-lg text-center">
            <div className="font-bold mb-2">Konec hry</div>
            <div>{summary}</div>
            <button className="mt-6 px-4 py-2 rounded-xl bg-blue-700 text-white font-bold shadow hover:bg-blue-800"
              onClick={() => window.location.reload()}>Zkusit znovu</button>
          </div>
        )}
        <div className="mt-8 text-center text-sm text-gray-500">Vytvořeno s pomocí AI pro inspiraci v AI hrách.</div>
      </div>
    </div>
  );
}
