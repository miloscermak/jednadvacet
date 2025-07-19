import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const BASE_PROMPT = `
Hraješ hru "21 otázek" s uživatelem. Tvým úkolem je uhodnout celebritu, kterou si uživatel myslí, pomocí maximálně 21 otázek. Řiď se těmito pravidly:

1. Pokládej otázky na základě dosavadních odpovědí, vždy tak, aby šly zodpovědět pouze „ANO“, „NE“ nebo „NEVÍM/NEDÁ SE ŘÍCT“.
2. Otázky čísluj a čekej na odpověď uživatele.
3. Po každé odpovědi krátce (jednou větou) zhodnoť, co nového ses dozvěděl.
4. Pokud si myslíš, že už znáš odpověď, místo otázky napiš svůj tip: „Myslím si, že jsi myslel/a: <jméno celebrity>. Je to správně?“
5. Pokud uhodneš, pogratuluj si, vypiš krátké informace o celebritě a popiš, jak ses k tomu dopracoval. Pokud ne, po 21 otázkách se zeptej na správné jméno a zhodnoť, proč se nepodařilo uhodnout.
6. Komunikuj pouze česky.

Historie otázek a odpovědí:
`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const history = body.history
    .map(
      (q: any, i: number) =>
        `${i + 1}. ${q.text}${q.answer ? ` - ${q.answer}` : ""}`
    )
    .join("\n");
  const messages = [
    {
      role: "system",
      content: BASE_PROMPT + "\n" + history + "\nDalší krok:",
    },
  ];
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages,
      max_tokens: 250,
      temperature: 0.7,
    }),
  });
  const data = await openaiRes.json();
  const output = data.choices?.[0]?.message?.content || "";

  if (
    output.toLowerCase().includes("myslím si, že jsi myslel") ||
    output.toLowerCase().includes("je to správně") ||
    output.toLowerCase().includes("pogratuluj si") ||
    output.toLowerCase().includes("konec hry")
  ) {
    return NextResponse.json({
      type: "guess",
      text: output,
      summary: output,
    });
  } else if (
    output.toLowerCase().includes("jaká byla správná odpověď") ||
    output.toLowerCase().includes("nepodařilo se uhodnout")
  ) {
    return NextResponse.json({
      type: "end",
      text: output,
      summary: output,
    });
  } else {
    return NextResponse.json({
      type: "question",
      text: output,
    });
  }
}
