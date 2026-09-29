import re

with open('src/views/DashboardView.tsx', 'r') as f:
    code = f.read()

# Add GoogleGenAI import
if "import { GoogleGenAI } from '@google/genai';" not in code:
    code = code.replace("import { LayoutGrid", "import { GoogleGenAI } from '@google/genai';\nimport { LayoutGrid")


# Replace handleAiAnalysis
target_ai_analysis = """  const handleAiAnalysis = async () => {
    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const response = await fetch('/api/analyze-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kitData: kitPieData })
      });
      const data = await response.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        alert('Erro: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao chamar a IA');
    } finally {
      setAiLoading(false);
    }
  };"""

replacement_ai_analysis = """  const getApiKey = () => {
    let key = localStorage.getItem('gemini_api_key');
    if (!key) {
      key = prompt('Para usar a Inteligência Artificial, insira sua chave da API do Google Gemini (ela ficará salva no seu navegador):');
      if (key) {
        localStorage.setItem('gemini_api_key', key);
      }
    }
    return key;
  };

  const handleAiAnalysis = async () => {
    const apiKey = getApiKey();
    if (!apiKey) return;

    setAiLoading(true);
    setAiAnalysis(null);
    try {
      const ai = new GoogleGenAI({ apiKey });
      const promptText = `Você é um Diretor de Vendas e Marketing altamente analítico. Aqui estão os dados de receita por categoria ("Kits") de uma clínica:\\n${JSON.stringify(kitPieData, null, 2)}\\n\\nFaça uma análise concisa e estratégica sobre esses dados:\\n1. Identifique o carro-chefe e seu impacto.\\n2. Identifique oportunidades de upsell ou cross-sell.\\n3. Sugira uma ação rápida de marketing para a categoria com pior desempenho ou maior potencial.\\n\\nAja com tom profissional, focado em resultados.\\nFormate sua resposta em parágrafos claros ou bullet points curtos usando Markdown.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
      });
      
      if (response.text) {
        setAiAnalysis(response.text);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes('API key not valid')) {
          localStorage.removeItem('gemini_api_key');
          alert('Chave de API inválida. Tente novamente.');
      } else {
          alert('Erro ao chamar a IA: ' + err.message);
      }
    } finally {
      setAiLoading(false);
    }
  };"""

code = code.replace(target_ai_analysis, replacement_ai_analysis)

# Replace handleAiContact
target_ai_contact = """             const handleAiContact = async (p: any, objective: 'retencao' | 'upsell', action: string) => {
                setAiGenerating(p.name);
                try {
                    const response = await fetch('/api/generate-contact', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ patient: p, objective })
                    });
                    const data = await response.json();
                    if (data.message) {
                        setGeneratedContact({ p, action, msg: data.message.trim() });
                    } else {
                        alert('Erro: ' + data.error);
                    }
                } catch (err) {
                    console.error(err);
                    alert('Erro ao gerar mensagem com IA');
                } finally {
                    setAiGenerating(null);
                }
             };"""

replacement_ai_contact = """             const handleAiContact = async (p: any, objective: 'retencao' | 'upsell', action: string) => {
                const apiKey = getApiKey();
                if (!apiKey) return;

                setAiGenerating(p.name);
                try {
                    const ai = new GoogleGenAI({ apiKey });
                    const historyText = p.txs?.map((tx: any) => `${tx.ym}: ${tx.proc} - R$ ${tx.cob}`).join('\\n') || 'Sem histórico';
                    const promptText = `Você é um assistente de inteligência comercial de uma clínica de estética de alto padrão.\\nO objetivo é criar uma mensagem de WhatsApp para o cliente "${p.name}".\\n\\nObjetivo do Contato: ${objective === 'retencao' ? 'Retenção/Reativação de VIP (cliente ausente há algum tempo, trazer de volta)' : 'Upsell/Upgrade (cliente ativo com potencial para procedimentos de maior valor)'}\\n\\nHistórico do Cliente:\\n${historyText}\\n\\nLTV (Valor total já gasto): R$ ${p.ltv}\\nÚltima visita: ${p.last_visit || 'Desconhecida'}\\n\\nInstruções:\\n- Crie uma mensagem curta, elegante e persuasiva, pronta para ser enviada por WhatsApp.\\n- Seja caloroso, mas mantenha o tom premium da clínica.\\n- Não use placeholders como "[Nome da Clínica]" se não souber o nome, apenas evite mencionar ou assuma a postura do profissional.\\n- Sugira o próximo passo de forma sutil (ex: agendar uma avaliação, conhecer uma novidade).\\n- Retorne APENAS o texto da mensagem, sem explicações adicionais.`;

                    const response = await ai.models.generateContent({
                        model: "gemini-3.5-flash",
                        contents: promptText,
                    });
                    
                    if (response.text) {
                        setGeneratedContact({ p, action, msg: response.text.trim() });
                    }
                } catch (err: any) {
                    console.error(err);
                    if (err.message && err.message.includes('API key not valid')) {
                        localStorage.removeItem('gemini_api_key');
                        alert('Chave de API inválida. Tente novamente.');
                    } else {
                        alert('Erro ao gerar mensagem com IA: ' + err.message);
                    }
                } finally {
                    setAiGenerating(null);
                }
             };"""

code = code.replace(target_ai_contact, replacement_ai_contact)

with open('src/views/DashboardView.tsx', 'w') as f:
    f.write(code)
print("DashboardView.tsx updated")
