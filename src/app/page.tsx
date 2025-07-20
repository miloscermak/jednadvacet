"use client";
import { useState } from "react";

interface Question {
  text: string;
  answer: string | null;
}

export default function DvacetJednaOtazek() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  async function startGame() {
    setIsLoading(true);
    setGameStarted(true);
    
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: [] }),
    });
    const data = await res.json();

    if (data.type === "question") {
      console.log("Received question:", data.text);
      setQuestions([{ text: data.text, answer: null }]);
    }
    setIsLoading(false);
  }

  async function sendAnswer(answer: string) {
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
      console.log("Received next question:", data.text);
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
    if (!gameStarted) {
      return (
        <div className="text-center mt-6">
          <button onClick={startGame} className="px-8 py-3 rounded-2xl shadow bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg transition-all">
            Začít hru
          </button>
        </div>
      );
    }
    return (
      <div className="flex gap-4 mt-6 justify-center">
        <button onClick={() => sendAnswer("ANO")} className="px-6 py-2 rounded-2xl shadow bg-green-100 hover:bg-green-200 text-green-800 font-bold text-lg transition-all">ANO</button>
        <button onClick={() => sendAnswer("NE")} className="px-6 py-2 rounded-2xl shadow bg-red-100 hover:bg-red-200 text-red-800 font-bold text-lg transition-all">NE</button>
        <button onClick={() => sendAnswer("NEVÍM / NEDÁ SE ŘÍCT")} className="px-6 py-2 rounded-2xl shadow bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-lg transition-all">NEVÍM / NEDÁ SE ŘÍCT</button>
      </div>
    );
  }

  function History() {
    const answeredQuestions = questions.filter(q => q.answer !== null);
    return (
      <div className="my-6">
        {answeredQuestions.map((q, i) => (
          <div key={i} className="mb-2 flex items-center">
            <span className="font-semibold text-blue-800 mr-2">{i + 1}.</span>
            <span className="mr-2">{q.text}</span>
            <span className="ml-4 rounded-full px-3 py-1 bg-blue-50 text-blue-900 border border-blue-200 text-sm">
              {q.answer}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-blue-100 flex flex-col items-center py-8 px-2">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-8 mt-6">
        <h1 className="text-3xl font-extrabold text-center text-blue-900 mb-3">20 otázek: Uhodni celebritu!</h1>
        <History />
        {!gameOver && !isLoading && gameStarted && questions.length > 0 && questions[questions.length - 1].answer == null && questions[questions.length - 1].text && (
          <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
            <div className="text-center text-lg font-semibold text-blue-900 mb-2">
              Otázka {questions.length}:
            </div>
            <div className="text-center text-xl font-bold text-blue-800 mb-4">
              {questions[questions.length - 1]?.text}
            </div>
            <div className="text-center text-lg font-semibold text-blue-700">
              Jak odpovíš?
            </div>
          </div>
        )}
        {!gameStarted && (
          <div className="text-center text-lg mb-4">
            Mysli si nějakou všeobecně známou celebritu a odpovídej na mé otázky!
          </div>
        )}
        <AnswerButtons />
        {gameOver && (
          <div className="mt-8 p-4 rounded-xl bg-green-50 text-green-900 shadow text-lg text-center">
            <div className="font-bold mb-2">Konec hry</div>
            <div>{summary}</div>
            <button className="mt-6 px-4 py-2 rounded-xl bg-blue-700 text-white font-bold shadow hover:bg-blue-800"
              onClick={() => {
                setQuestions([]);
                setGameStarted(false);
                setGameOver(false);
                setSummary(null);
              }}>Zkusit znovu</button>
          </div>
        )}
        <div className="mt-8 text-center text-sm text-gray-500">Vytvořeno s pomocí AI pro inspiraci v AI hrách.</div>
      </div>
    </div>
  );
}
