import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { nome, idade, caracteristicas, genero, cenario, mensagem } = req.body;

    if (!nome || !idade || !genero) return res.status(400).json({ error: 'Dados incompletos.' });

    const prompt = `
      Escreva uma história infantil mágica.
      Protagonista: ${nome}, ${idade} anos. Características: ${caracteristicas || 'padrão'}.
      Cenário: ${cenario}. Tema: ${genero}. Mensagem: ${mensagem}.

      REGRAS HTML:
      - Retorne APENAS HTML válido.
      - NÃO use tags <html>, <head>, <body>.
      - Use <h2> para o Título (criativo).
      - Use <p> para parágrafos.
      - Separe a história em 3 ou 4 parágrafos curtos.
      - Encerre com um <p class="mensagem-final"><strong>Mensagem:</strong> ${mensagem}</p>.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    return res.status(200).json({ result: completion.choices[0].message.content });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gerar história.' });
  }
}
