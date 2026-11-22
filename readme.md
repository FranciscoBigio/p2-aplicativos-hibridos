# D&D 5e — Ficha, Grimório e Bestiário

Aplicativo mobile híbrido desenvolvido individualmente em **React Native + Expo** para criação e gerenciamento de fichas de personagens, consulta de compêndio, rolagem de dados poliedrais e bestiário completo de **Dungeons & Dragons 5ª Edição**.
---

## Tecnologias e Regras Técnicas

- **Framework:** React Native com Expo
- **Navegação:** Exclusivamente **Expo Router** (`expo-router`), com roteamento baseado em arquivos em `app/`, layouts (`_layout.js`), grupos de rotas (`(auth)`, `(tabs)`) e rotas dinâmicas (`[id]`, `[index]`)
- **Estilização:** Exclusivamente **`StyleSheet.create` e Flexbox** nativos do React Native (`flex`, `flexDirection`, `justifyContent`, `alignItems`, `gap`), sem bibliotecas de UI prontas ou CSS-in-JS de terceiros
- **Consumo de API Real:** Integração via `fetch` com a API oficial **D&D 5e API** (`https://www.dnd5eapi.co/api` — documentação em https://docs.dnd5eapi.co/introduction) para:
  - Raças (`/races` e `/races/{index}`)
  - Classes (`/classes` e `/classes/{index}`)
  - Magias (`/spells` e `/spells/{index}`)
  - Equipamentos (`/equipment` e `/equipment/{index}`)
  - Monstros (`/monsters` e `/monsters/{index}`)
- **Armazenamento Local:** **`@react-native-async-storage/async-storage`** para persistência de contas, sessão ativa, CRUD de personagens, atualizações em tempo real na ficha (PV, espaços de magia, moedas, inventário e perícias), monstros favoritados e histórico de rolagens de dados
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
│   ├── login.js                # TELA 1: Login (valida no AsyncStorage + botão de conta demo)
│   ├── register.js             # TELA 2: Cadastro de Conta (salva novo usuário no AsyncStorage)
│   └── forgot-password.js      # TELA 3: Recuperar/Redefinir Senha (busca e-mail e atualiza senha local)
├── (tabs)/
│   ├── _layout.js              # Bottom Tabs principais (Personagens, Compêndio, Monstros, Dados, Perfil)
│   ├── index.js                # TELA 4: Meus Personagens (lista fichas do AsyncStorage, busca e botão excluir)
│   ├── compendium.js           # TELA 5: Compêndio D&D 5e (busca na API por Magias, Equipamentos, Raças e Classes)
│   ├── monsters.js             # TELA 6: Bestiário / Lista de Monstros (consome /api/monsters, busca, filtro por ND e favoritos)
│   ├── dice.js                 # TELA 7: Rolador de Dados (d4, d6, d8, d10, d12, d20, d100 + mod + histórico no AsyncStorage)
│   └── profile.js              # TELA 8: Perfil do Jogador (estatísticas locais, monstros favoritos, reset demo e Logout)
├── create/
│   ├── _layout.js              # Stack de criação de ficha
│   ├── step1-identity.js       # TELA 9: Passo 1 - Nome, Antecedente + seleção de Raça e Classe reais da API D&D 5e
│   └── step2-attributes.js     # TELA 10: Passo 2 - Distribuição de Atributos (Point Buy), bônus racial da API, cálculo de PV e salvar
├── character/
│   └── [id]/
│       ├── _layout.js          # Navegação interna da ficha selecionada
│       ├── index.js            # TELA 11: Visão Geral da Ficha (PV interativo +/-, CA, Iniciativa, Salvaguardas e Perícias)
│       ├── inventory.js        # TELA 12: Mochila & Equipamentos (itens do personagem, ouro, busca e adição de itens da API)
│       └── spells.js           # TELA 13: Grimório & Magias (slots de magia interativos + busca/aprendizado de magias da API)
├── details/
│   └── api-item.js             # TELA 14: Detalhes do Compêndio (exibe dados completos de Magia, Item, Raça ou Classe da API)
└── monster/
    └── [index].js              # TELA 15: Stat Block Completo do Monstro (consome /api/monsters/{index}, CA, PV, atributos, ações, traços, ações lendárias e favoritar)

src/
├── theme/colors.js             # Paleta de cores, bordas e espaçamentos padronizados
├── services/
│   ├── dndApi.js               # Funções de consumo da https://www.dnd5eapi.co/api (incluindo /monsters)
│   └── storage.js              # Funções CRUD com AsyncStorage (usuários, sessão, personagens, monstros favoritos, dados)
├── utils/
│   └── dndRules.js             # Cálculo de modificador ((val - 10) / 2), bônus de proficiência e PV inicial
└── components/
    ├── CustomButton.js         # Botão reutilizável com Flexbox e variantes
    ├── CustomInput.js          # Input estilizado com rótulo e ícone
    ├── StatBox.js              # Caixa de atributo D&D (FOR, DES, CON, INT, SAB, CAR)
    └── LoadingView.js          # Indicador de carregamento padronizado
```

---

## Mapa das 15 Telas

| # | Tela | Rota | Descrição |
| :-: | :--- | :--- | :--- |
| 01 | Login | `app/(auth)/login.js` | Autenticação validada no `AsyncStorage` e acesso rápido com conta demo pré-populada. |
| 02 | Cadastro | `app/(auth)/register.js` | Criação de conta de jogador persistida localmente no `AsyncStorage`. |
| 03 | Recuperar Senha | `app/(auth)/forgot-password.js` | Localização de conta por e-mail e redefinição de senha local. |
| 04 | Meus Personagens | `app/(tabs)/index.js` | Listagem das fichas salvas, busca em tempo real e exclusão com confirmação. |
| 05 | Compêndio D&D 5e | `app/(tabs)/compendium.js` | Consulta em tempo real na API para Magias, Equipamentos, Raças e Classes. |
| 06 | Bestiário (Monstros) | `app/(tabs)/monsters.js` | Lista completa de `/api/monsters`, busca por nome, filtros rápidos ("Todos", "Favoritos", "ND Baixo 0-4", "ND Médio 5-10", "ND Alto 11+") e estrela de favoritos no `AsyncStorage`. |
| 07 | Rolador de Dados | `app/(tabs)/dice.js` | Dados poliedrais (`d4` a `d100`), modificadores, detecção de críticos e histórico salvo localmente. |
| 08 | Perfil do Jogador | `app/(tabs)/profile.js` | Estatísticas locais, acesso aos monstros favoritos, reset de dados demo e logout. |
| 09 | Criação — Passo 1 | `app/create/step1-identity.js` | Nome, antecedente e escolha de Raça e Classe reais da API com traços e proficiências. |
| 10 | Criação — Passo 2 | `app/create/step2-attributes.js` | Distribuição de atributos (*Point Buy*), bônus raciais da API, cálculo de PV inicial e salvamento. |
| 11 | Ficha — Visão Geral | `app/character/[id]/index.js` | Controle interativo de PV (`+/-`), CA, Iniciativa, atributos (`StatBox`), salvaguardas e perícias. |
| 12 | Ficha — Inventário | `app/character/[id]/inventory.js` | Gestão de moedas, carga e modal para buscar/adicionar equipamentos reais da API. |
| 13 | Ficha — Grimório | `app/character/[id]/spells.js` | Rastreador interativo de espaços de magia e busca/aprendizado de magias da API. |
| 14 | Detalhes do Compêndio | `app/details/api-item.js` | Visualização detalhada de Magia, Equipamento, Raça ou Classe consultada na API. |
| 15 | Stat Block do Monstro | `app/monster/[index].js` | Stat Block clássico de D&D 5e via `/api/monsters/{index}`: CA, PV, deslocamento, 6 atributos com modificadores, resistências/imunidades, sentidos, idiomas, ND/XP, habilidades especiais, ações, ações lendárias, favoritar e atalho para rolar dados. |

---

## Como Executar o Projeto

```bash
# Instalar dependências
npm install

# Iniciar o servidor Expo
npx expo start
```