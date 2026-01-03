import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // Configuração de CORS para permitir requisições do front
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { nome, idade, caracteristicas, genero, cenario, mensagem } = req.body;

    // Validação básica
    if (!nome || !idade || !genero) {
      return res.status(400).json({ error: 'Dados incompletos.' });
    }

    const prompt = `
      Você é um escritor profissional de livros infantis.
      Crie uma história curta, envolvente e mágica para uma criança.
      
      DADOS DA CRIANÇA:
      - Nome: ${nome}
      - Idade: ${idade} anos
      - Características físicas: ${caracteristicas || 'Não especificado'}
      
      CONFIGURAÇÃO DA HISTÓRIA:
      - Gênero: ${genero}
      - Cenário Principal: ${cenario || 'Um lugar mágico'}
      - Lição/Mensagem Moral a reforçar: ${mensagem || 'Amizade e coragem'}

      REGRAS DE FORMATAÇÃO:
      - O texto deve ser formatado em HTML (sem as tags <html>, <head> ou <body>).
      - Use <h2> para o Título da História (Crie um título criativo).
      - Use <p> para os parágrafos.
      - A linguagem deve ser adequada para uma criança de ${idade} anos.
      - A história deve ter no máximo 400 palavras.
      - Termine com um parágrafo final emocionante reforçando a mensagem: "${mensagem}".
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modelo rápido, barato e inteligente
      messages: [
        { role: "system", content: "Você é um assistente criativo que escreve histórias infantis em formato HTML." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const storyHtml = completion.choices[0].message.content;

    return res.status(200).json({ result: storyHtml });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao gerar a história.' });
  }
}
