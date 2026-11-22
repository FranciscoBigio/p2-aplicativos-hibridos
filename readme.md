# D&D 5e — Ficha, Grimório e Bestiário (`v1.0.0`)

Aplicativo mobile híbrido **100% funcional** desenvolvido individualmente em **React Native + Expo** para criação e gerenciamento de fichas de personagens, consulta de compêndio, rolagem de dados poliedrais e bestiário completo de **Dungeons & Dragons 5ª Edição**.

- **Versão atual:** `v1.0.0` (Concluído)
- **Repositório:** https://github.com/FranciscoBigio/p2-aplicativos-hibridos.git
- **Branch principal:** `main`
- **Versionamento:** SemVer (`vMAJOR.MINOR.PATCH`) + Conventional Commits no imperativo

---

## Tecnologias e Regras Técnicas

- **Framework:** React Native + Expo (Mobile via Expo Go e Web via Metro)
- **Navegação:** Exclusivamente **Expo Router** (`expo-router`), com roteamento baseado em arquivos em `app/`, layouts (`_layout.js`), grupos de rotas (`(auth)`, `(tabs)`) e rotas dinâmicas (`[id]`, `[index]`)
- **Estilização:** Exclusivamente **`StyleSheet.create` e Flexbox** nativos do React Native (`flex`, `flexDirection`, `justifyContent`, `alignItems`, `gap`), sem Tailwind, NativeWind, Styled-Components ou bibliotecas de UI prontas
- **Consumo de API Real:** Integração via `fetch` com cache em memória e tratamento de erros de rede/timeout com a API oficial **D&D 5e API** (`https://www.dnd5eapi.co/api` — documentação em https://docs.dnd5eapi.co/introduction) para:
  - Raças (`/races` e `/races/{index}`)
  - Classes (`/classes` e `/classes/{index}`)
  - Magias (`/spells` e `/spells/{index}`)
  - Equipamentos (`/equipment` e `/equipment/{index}`)
  - Monstros (`/monsters`, `/monsters?challenge_rating=...` e `/monsters/{index}`)
- **Armazenamento Local Real:** **`@react-native-async-storage/async-storage`** em `src/services/storage.js` persistindo:
  - Contas cadastradas, recuperação de senha e sessão ativa (incluindo conta demo pré-populada)
  - CRUD completo das fichas de personagens
  - Alterações em tempo real na ficha (PV atual, espaços de magia, moedas, itens equipados/adicionados, salvaguardas e perícias treinadas)
  - Lista de monstros favoritados no Bestiário
  - Histórico das últimas 50 rolagens de dados
- **Identidade Visual (*Dark Fantasy*):**
  - Fundo principal: `#0F1115`
  - Cards / Superfícies: `#1A1D24`
  - Bordas: `#2A2F3A`
  - Destaque primário (Dourado): `#D97706`
  - Vida / Perigo: `#DC2626`
  - Magia: `#2563EB`
  - Texto principal: `#F3F4F6`
  - Texto secundário: `#9CA3AF`

---

## Arquitetura do Projeto

```text
app/
├── _layout.js                  # Layout raiz (verifica sessão no AsyncStorage e redireciona)
├── (auth)/
│   ├── _layout.js              # Stack de autenticação
│   ├── login.js                # TELA 1: Login (AsyncStorage + acesso rápido Conta Demo)
│   ├── register.js             # TELA 2: Cadastro de Conta local
│   └── forgot-password.js      # TELA 3: Recuperação e redefinição de senha local
├── (tabs)/
│   ├── _layout.js              # Bottom Tabs (Personagens, Compêndio, Monstros, Dados, Perfil)
│   ├── index.js                # TELA 4: Meus Personagens (busca, barra de PV e exclusão)
│   ├── compendium.js           # TELA 5: Compêndio D&D 5e (Magias, Equipamentos, Raças e Classes)
│   ├── monsters.js             # TELA 6: Bestiário (API /monsters, busca, filtros de ND e favoritos)
│   ├── dice.js                 # TELA 7: Rolador de Dados (d4-d100, mod, críticos e histórico)
│   └── profile.js              # TELA 8: Perfil do Jogador (estatísticas, favoritos, reset demo e logout)
├── create/
│   ├── _layout.js              # Stack de criação de ficha
│   ├── step1-identity.js       # TELA 9: Passo 1 (Nome, Antecedente, Raça e Classe reais da API)
│   └── step2-attributes.js     # TELA 10: Passo 2 (Point Buy, bônus raciais da API, PV inicial e salvar)
├── character/
│   └── [id]/
│       ├── _layout.js          # Tabs internas da ficha selecionada
│       ├── index.js            # TELA 11: Visão Geral da Ficha (PV +/-, CA, StatBox, Salvaguardas e Perícias)
│       ├── inventory.js        # TELA 12: Mochila & Equipamentos (moedas, carga e modal da API)
│       └── spells.js           # TELA 13: Grimório & Magias (slots interativos e aprendizado via API)
├── details/
│   └── api-item.js             # TELA 14: Detalhes do Compêndio (Magia, Equipamento, Raça ou Classe)
└── monster/
    └── [index].js              # TELA 15: Stat Block Completo do Monstro (API /monsters/{index})

src/
├── theme/colors.js             # Paleta Dark Fantasy, espaçamentos e limites responsivos
├── services/
│   ├── dndApi.js               # Serviço de consumo da https://www.dnd5eapi.co/api
│   └── storage.js              # Persistência local completa com AsyncStorage
├── utils/
│   └── dndRules.js             # Regras D&D 5e (modificadores, proficiência, PV, Point Buy, ND)
└── components/
    ├── CustomButton.js         # Botão reutilizável com variantes Dark Fantasy
    ├── CustomInput.js          # Input estilizado com ícone, limpar e exibir senha
    ├── StatBox.js              # Caixa de atributo D&D clicável para rolagem
    └── LoadingView.js          # Estado padronizado de carregamento e erro com retry
```

---

## Mapa das 15 Telas Implementadas

| # | Tela | Rota | Status |
| :-: | :--- | :--- | :-: |
| 01 | Login + Conta Demo | `app/(auth)/login.js` | Concluída |
| 02 | Cadastro de Conta | `app/(auth)/register.js` | Concluída |
| 03 | Recuperar/Redefinir Senha | `app/(auth)/forgot-password.js` | Concluída |
| 04 | Meus Personagens | `app/(tabs)/index.js` | Concluída |
| 05 | Compêndio D&D 5e | `app/(tabs)/compendium.js` | Concluída |
| 06 | Bestiário / Lista de Monstros | `app/(tabs)/monsters.js` | Concluída |
| 07 | Rolador de Dados | `app/(tabs)/dice.js` | Concluída |
| 08 | Perfil do Jogador | `app/(tabs)/profile.js` | Concluída |
| 09 | Criação — Passo 1 (Identidade) | `app/create/step1-identity.js` | Concluída |
| 10 | Criação — Passo 2 (Atributos) | `app/create/step2-attributes.js` | Concluída |
| 11 | Ficha — Visão Geral | `app/character/[id]/index.js` | Concluída |
| 12 | Ficha — Inventário | `app/character/[id]/inventory.js` | Concluída |
| 13 | Ficha — Grimório & Magias | `app/character/[id]/spells.js` | Concluída |
| 14 | Detalhes do Compêndio | `app/details/api-item.js` | Concluída |
| 15 | Stat Block do Monstro | `app/monster/[index].js` | Concluída |

---

## Como Executar o Projeto

```bash
# 1. Entrar na pasta do projeto
cd p2-aplicativos-hibridos

# 2. Instalar dependências
npm install

# 3. Iniciar o servidor Expo (Mobile + Web)
npm start
```

- **Celular (Expo Go):** escaneie o QR Code exibido no terminal.
- **Navegador (Web):** pressione **`w`** no terminal após `npm start` (ou rode `npm run web`).
- **Acesso rápido para avaliação:** na tela de Login, toque em **"Entrar com Conta Demo"** para carregar automaticamente 2 fichas completas (*Thalion Estrela-Prateada* e *Kaelen Punho-de-Ferro*) e monstros favoritos.
