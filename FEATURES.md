# Features do Gerador de Campanhas V20

Este documento detalha as funcionalidades do Gerador de Campanhas para Vampiro: A Máscara 20º Aniversário (V20). A aplicação foi construída com React, TypeScript e Vite, utilizando uma abordagem baseada em componentes para fornecer uma experiência rica e interativa para Narradores.

## Funcionalidades Principais

### 1. Geração de Crônica via Inteligência Artificial
- **Coração do Projeto:** A aplicação integra-se a um serviço de IA (provavelmente o Gemini, conforme indicado em `services/gemini.ts`) para gerar narrativas complexas e detalhadas.
- **Entrada do Usuário:** O usuário preenche um formulário (`components/FormFields.tsx`) com parâmetros para a crônica, como tema, tom, número de jogadores, clãs envolvidos e localização inicial.
- **Saída da IA:** Com base nas entradas, a IA gera o enredo principal, personagens não-jogadores (NPCs), antagonistas, ganchos de história e segredos.

### 2. Visualização de Relacionamentos em Grafo
- **Componente:** `components/RelationshipGraph.tsx`
- **Funcionalidade:** Gera um grafo interativo que mapeia visualmente as conexões entre os diferentes personagens e facções da crônica.
- **Detalhes:** Permite ao Narrador entender rapidamente as teias de intriga, alianças, rivalidades e hierarquias de poder. Nós no grafo podem representar personagens, coteries, clãs ou outras facções.

### 3. Apresentação de Entidades em Cards
- **Componente:** `components/EntityCards.tsx`
- **Funcionalidade:** Exibe as informações de cada entidade gerada (personagens, locais, itens, etc.) em formato de "card" ou "ficha".
- **Detalhes:** Cada card contém as informações essenciais da entidade, como nome, atributos, história, segredos e conexões relevantes, tornando a consulta durante o jogo rápida e eficiente.

### 4. Biblioteca de Crônicas (Persistência Local)
- **Componente:** `components/ChronicleLibrary.tsx`
- **Funcionalidade:** Permite que os usuários salvem as crônicas geradas no armazenamento local do navegador (`localStorage`).
- **Detalhes:** O Narrador pode criar e gerenciar múltiplas campanhas, carregando-as posteriormente para continuar a edição ou para consulta durante as sessões de jogo. É possível visualizar, carregar e deletar crônicas salvas.

## Exportação e Integração

### 1. Exportação para Foundry VTT
- **Módulo:** `utils/foundryExport.ts`
- **Funcionalidade:** Converte os dados da crônica gerada (personagens, notas da história, relacionamentos) em um formato JSON compatível para importação direta no Virtual Tabletop (VTT) Foundry.
- **Benefício:** Automatiza a criação de Atores (Actors) e Itens de Diário (Journal Entries) no Foundry, economizando horas de preparação manual para o Narrador que joga online.

### 2. Exportação para PDF
- **Módulo:** `utils/pdfExport.ts`
- **Funcionalidade:** Gera um documento PDF completo da crônica.
- **Conteúdo do PDF:** Inclui a sinopse da história, fichas de personagens detalhadas, descrições de locais e uma imagem estática do grafo de relacionamentos. Ideal para quem prefere jogar presencialmente ou ter uma cópia de segurança offline.

## Motor de Regras e Lógica Interna

### 1. Conformidade com as Regras do V20
- **Módulo:** `utils/v20Rules.ts`
- **Funcionalidade:** Contém a lógica, constantes e dados específicos do sistema Vampiro: A Máscara 20º Aniversário.
- **Detalhes:** Garante que a geração de personagens (Clãs, Disciplinas, Atributos, Habilidades, Antecedentes) e outros elementos do cenário esteja em conformidade com o livro de regras, fornecendo conteúdo lore-friendly e mecanicamente correto.

### 2. Estrutura de Dados Fortemente Tipada
- **Arquivo:** `types.ts`
- **Funcionalidade:** Define todas as interfaces e tipos de dados usados na aplicação (ex: `Character`, `Chronicle`, `Relationship`, `Clan`).
- **Benefício:** Assegura a consistência dos dados em todo o sistema, desde a geração pela IA até a exibição nos componentes e a exportação, além de facilitar a manutenção e a expansão do código.

## Interface e Experiência do Usuário (UI/UX)

### 1. Formulários Guiados e Interativos
- **Componente:** `components/FormFields.tsx`
- **Funcionalidade:** Oferece uma coleção de campos de formulário reutilizáveis e estilizados (inputs de texto, seletores, sliders) que guiam o usuário durante o processo de criação da crônica.

### 2. Ícones Customizados
- **Componente:** `components/Icons.tsx`
- **Funcionalidade:** Centraliza um conjunto de ícones SVG personalizados (provavelmente para clãs, disciplinas ou ações da UI), garantindo uma identidade visual coesa e temática para a aplicação.
