import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { nome, idade, caracteristicas, genero, cenario, mensagem } = req.body;

    if (!nome || !idade || !genero) {
      return res.status(400).json({ error: 'Dados incompletos.' });
    }

    // 1. Definição do Prompt de Texto
    const textPrompt = `
      Escreva uma história infantil mágica.
      Protagonista: ${nome}, ${idade} anos. Características: ${caracteristicas || 'padrão'}.
      Cenário: ${cenario}.
      Tema: ${genero}.
      Mensagem Moral: ${mensagem}.

      REGRAS HTML:
      - Retorne APENAS HTML válido dentro de uma div principal.
      - NÃO use tags <html>, <head>, <body>.
      - Use <h2> para o Título.
      - Use <p> para parágrafos curtos.
      - A história deve ser dividida em 3 partes curtas.
      - Insira a tag <div id="illustration-placeholder"></div> exatamente após o segundo parágrafo.
      - Encerre com uma mensagem motivacional em itálico.
    `;

    // 2. Definição do Prompt da Imagem (Otimizado para DALL-E 2 ou 3)
    const imagePrompt = `Children's book illustration, cartoon style, cute, colorful.
    Character: ${nome}, ${idade} years old kid, ${caracteristicas || 'happy'}.
    Setting: ${cenario}. Theme: ${genero}.
    Action: Standing heroically or discovering something magical.`;

    // 3. Execução em PARALELO (Texto + Imagem) para velocidade
    const [textCompletion, imageResponse] = await Promise.all([
      openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: textPrompt }],
        temperature: 0.7,
      }),
      openai.images.generate({
        model: "dall-e-2", // DALL-E 2 é mais rápido para MVP. Se tiver crédito/tier pago, use dall-e-3
        prompt: imagePrompt,
        n: 1,
        size: "512x512", // Tamanho otimizado para web
      })
    ]);

    let storyHtml = textCompletion.choices[0].message.content;
    const imageUrl = imageResponse.data[0].url;

    // 4. Injeção da Imagem no HTML
    const imageTag = `
      <div class="story-image-container">
        <img src="${imageUrl}" alt="Ilustração da história" crossorigin="anonymous" />
      </div>
    `;

    // Substitui o placeholder pela imagem
    if (storyHtml.includes('id="illustration-placeholder"')) {
      storyHtml = storyHtml.replace('<div id="illustration-placeholder"></div>', imageTag);
    } else {
      // Fallback se a IA esquecer o placeholder
      storyHtml = imageTag + storyHtml;
    }

    return res.status(200).json({ result: storyHtml });

  } catch (error) {
    console.error("Erro na API:", error);
    return res.status(500).json({ error: 'Erro ao gerar a história. Tente novamente.' });
  }
}
