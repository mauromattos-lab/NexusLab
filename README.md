# Nexus: Diagnóstico de Negócios com IA 🚀

**[Link para o Repositório](https://github.com/mauro-nexus/nexus-ai.git)**

**Nexus** é um super-agente de IA que diagnostica o nível de integração de IA em pequenas empresas e profissionais. Ele conduz uma entrevista dinâmica e, ao final, entrega um relatório estratégico com uma lista priorizada de soluções para otimizar operações, reduzir custos e aumentar a receita.

---

## ✨ Recursos Principais

- **Diagnóstico Inteligente:** Utiliza a API do Gemini para analisar dados de negócios e fornecer insights acionáveis.
- **Questionário Dinâmico:** Uma conversa fluida que se adapta ao tipo de negócio do usuário (serviços, produtos, recorrência, etc.).
- **Métricas de Impacto:** Calcula e exibe KPIs cruciais como Potencial de Transformação, Economia Potencial e Ganho de Produtividade.
- **Relatório Detalhado:** Apresenta um plano de ação claro com soluções de IA priorizadas, incluindo ROI esperado e tempo de implementação.
- **Exportação para PDF:** Permite que o usuário baixe um relatório profissional e detalhado para consulta offline ou para compartilhar.
- **Design Futurista:** Interface com tema cyberpunk, responsiva e com micro-interações para uma experiência de usuário envolvente.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/)
- **Core IA:** [Google Gemini API](https://ai.google.dev/)
- **Backend (Leads):** [Supabase](https://supabase.com/) (Opcional, para salvar os contatos gerados)
- **PDF Generation:** `html2canvas` + `jspdf`

---

## ⚙️ Como Começar

Este projeto foi desenhado para rodar em ambientes de desenvolvimento online que suportam `importmaps` e injeção de variáveis de ambiente.

### Variáveis de Ambiente

Para que a aplicação funcione corretamente, é crucial configurar as seguintes variáveis de ambiente na sua plataforma de desenvolvimento ou em um arquivo `.env` na raiz do projeto:

- `API_KEY`: Sua chave de API do Google AI Studio para acessar o modelo Gemini.
- `SUPABASE_URL`: (Opcional) A URL do seu projeto Supabase para salvar os leads.
- `SUPABASE_KEY`: (Opcional) A chave `anon` (pública) do seu projeto Supabase.

Se você não configurar as variáveis do Supabase, a aplicação funcionará, mas o salvamento de leads será desativado.

---

## 📂 Estrutura do Projeto

```
/
├── components/          # Componentes React reutilizáveis (Welcome, Chat, Results, etc.)
├── services/            # Lógica de comunicação com APIs externas (Gemini, Supabase)
├── types/               # Definições de tipos TypeScript para o projeto
├── App.tsx              # Componente principal que gerencia o estado e as telas
├── config.ts            # Configurações da aplicação (links, etc.)
├── index.html           # Ponto de entrada HTML
├── index.tsx            # Ponto de entrada da aplicação React
└── README.md            # Este arquivo :)
```

---

## 🌊 Como Funciona

1.  **WelcomeScreen:** O usuário é recebido com uma introdução sobre o que o Nexus faz.
2.  **DiagnosisForm (Chat):** Uma conversa guiada coleta dados sobre o negócio do usuário. O fluxo de perguntas se adapta ao modelo de negócio informado.
3.  **LoadingScreen:** Enquanto a API do Gemini processa os dados, uma tela de carregamento é exibida.
4.  **ResultsScreen:** O diagnóstico é apresentado com métricas, um plano de ação detalhado e opções para baixar o relatório em PDF ou agendar uma consultoria.

---

## 🤝 Contribuições

Contribuições são bem-vindas! Se você tem ideias para melhorar o Nexus, sinta-se à vontade para:

1.  Fazer um **Fork** deste repositório.
2.  Criar uma nova **Branch** (`git checkout -b feature/sua-feature`).
3.  Fazer **Commit** das suas alterações (`git commit -m 'Adiciona sua-feature'`).
4.  Fazer **Push** para a Branch (`git push origin feature/sua-feature`).
5.  Abrir um **Pull Request**.

---

## 📄 Licença

Este projeto está sob a licença MIT.