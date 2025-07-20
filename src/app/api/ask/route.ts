import { NextRequest, NextResponse } from "next/server";

interface Question {
  text: string;
  answer: string | null;
}
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const BASE_PROMPT = `
Budeš hrát hru "dvacet otázek" s uživatelem. Tvým úkolem je uhodnout celebritu, kterou si uživatel myslí. Řiď se následujícími pokyny:

1. Pravidla hry:
   - Uživatel si myslí všeobecně známou celebritu.
   - Ty máš za úkol tuto celebritu uhodnout pomocí otázek.
   - Máš maximálně 20 otázek na uhodnutí.

2. Pokládání otázek:
   - Formuluj otázky tak, aby na ně bylo možné odpovědět pouze "ano", "ne" nebo "nelze říct/nevím".
   - Otázky čísluj a pokládej je jednu po druhé.
   - Před položením další otázky vždy počkej na odpověď uživatele.

3. Zpracování odpovědí:
   - Po každé odpovědi krátce zhodnoť získanou informaci.
   - Využij získané informace k zúžení okruhu možných celebrit.

4. Podmínky vítězství:
   - Pokud uhádneš celebritu do 20 otázek nebo dříve, vyhráváš ty.
   - Pokud neuhádneš celebritu ani po 20 otázkách, vyhrává uživatel.

5. Ukončení hry:
   - Po uhodnutí celebrity nebo vyčerpání všech 20 otázek hru ukonči.
   - Zhodnoť průběh hry, včetně počtu položených otázek a výsledku.

6. Jazyk:
   - Veškerá komunikace musí probíhat v češtině.

Historie otázek a odpovědí:
`;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const history = body.history
    .map(
      (q: Question, i: number) =>
        `${i + 1}. ${q.text}${q.answer ? ` - ${q.answer}` : ""}`
    )
    .join("\n");
  
  const systemContent = history.length > 0 
    ? BASE_PROMPT + "\n" + history + "\nDalší krok:"
    : BASE_PROMPT + "\nZačni hru první otázkou:";
    
  const messages = [
    {
      role: "system",
      content: systemContent,
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
  
  console.log("OpenAI Response:", data);
  console.log("Extracted output:", output);

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
    // Odstranit číslování z otázky (např. "1. Jsi muž?" -> "Jsi muž?")
    const cleanText = output.replace(/^\d+\.\s*/, '').trim();
    return NextResponse.json({
      type: "question",
      text: cleanText,
    });
  }
}
