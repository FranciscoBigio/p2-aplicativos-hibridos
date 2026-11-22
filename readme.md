# D&D 5e — Ficha, Grimório e Bestiário (`v1.4.4`)

Aplicativo mobile híbrido **100% funcional** desenvolvido individualmente em **React Native + Expo** para criação, evolução e gerenciamento de fichas de personagens, consulta de compêndio, rolagem de dados poliedrais (e rolagens imediatas em combate) e bestiário completo de **Dungeons & Dragons 5ª Edição**.

- **Versão atual:** `v1.4.4`
- **Repositório:** https://github.com/FranciscoBigio/p2-aplicativos-hibridos.git
- **Download do APK (Android):** https://expo.dev/accounts/franciscobigios-team/projects/p2-aplicativos-hibridos/builds/481bc7fa-bb4f-4b75-a515-343455215b06
- **Branch principal:** `main`
- **Versionamento:** SemVer (`vMAJOR.MINOR.PATCH`) + Conventional Commits no imperativo

---

## Download e Instalação do APK (Android)

Você pode instalar o aplicativo diretamente em qualquer celular **Android** sem precisar rodar o servidor local no PC:

1. Acesse o link oficial do build no Expo pelo celular:
   👉 **https://expo.dev/accounts/franciscobigios-team/projects/p2-aplicativos-hibridos/builds/481bc7fa-bb4f-4b75-a515-343455215b06**
2. Toque em **Install / Download** para baixar o arquivo `.apk`.
3. Ao abrir o `.apk`, caso o Android solicite:
   - Permita **"Instalar apps desconhecidos"** para o navegador.
   - Se o Google Play Protect exibir aviso de app não reconhecido, toque em **"Mais detalhes" → "Instalar assim mesmo"**.
4. Abra o aplicativo **D&D 5e Grimório** e toque em **"Entrar com Conta Demo"** (ou crie uma nova conta local) para testar imediatamente!

---

## Tecnologias e Regras Técnicas

- **Framework:** React Native + Expo SDK 58 (Mobile via Expo Go / Expo Dev Build e Web via Metro)
- **Build Nativo:** Configurado com **EAS Build** (`eas.json`) e `expo-dev-client` para perfis `development`, `preview` (APK) e `production`
- **Navegação:** Exclusivamente **Expo Router** (`expo-router`), com roteamento baseado em arquivos em `app/`, layouts (`_layout.js`), grupos de rotas (`(auth)`, `(tabs)`) e rotas dinâmicas (`[id]`, `[index]`)
- **Estilização:** Exclusivamente **`StyleSheet.create` e Flexbox** nativos do React Native (`flex`, `flexDirection`, `justifyContent`, `alignItems`, `gap`), sem Tailwind, NativeWind, Styled-Components ou bibliotecas de UI prontas
- **Consumo de API Real:** Integração via `fetch` com cache em memória e tratamento de erros de rede/timeout com a API oficial **D&D 5e API** (`https://www.dnd5eapi.co/api` — documentação em https://docs.dnd5eapi.co/introduction) para:
  - Raças (`/races` e `/races/{index}`)
  - Classes, Níveis e Magias por Classe (`/classes`, `/classes/{index}`, `/classes/{index}/levels` e `/classes/{index}/spells`)
  - Magias (`/spells` e `/spells/{index}`)
  - Equipamentos e Armas (`/equipment` e `/equipment/{index}`)
  - Traços Raciais e Habilidades de Classe (`/traits/{index}` e `/features/{index}`)
  - Monstros (`/monsters`, `/monsters?challenge_rating=...` e `/monsters/{index}`)
- **Armazenamento Local Real:** **`@react-native-async-storage/async-storage`** em `src/services/storage.js` persistindo localmente em cada dispositivo:
  - Contas cadastradas, recuperação de senha e sessão ativa (incluindo conta demo pré-populada)
  - CRUD completo das fichas de personagens (incluindo evolução de nível, atributos, PV, habilidades de classe e espaços de magia até o 9º círculo)
  - Alterações em tempo real na ficha (PV atual, espaços de magia, moedas, itens/armas equipados, salvaguardas e perícias treinadas)
  - Lista de monstros favoritados no Bestiário
  - Histórico das últimas 50 rolagens de dados (incluindo rolagens rápidas feitas direto na ficha)
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
├── _layout.js                  # Layout raiz (verifica sessão no AsyncStorage com useRootNavigationState)
├── (auth)/
│   ├── _layout.js              # Stack de autenticação
│   ├── login.js                # TELA 01: Login (AsyncStorage + acesso rápido Conta Demo)
│   ├── register.js             # TELA 02: Cadastro de Conta local
│   └── forgot-password.js      # TELA 03: Recuperação e redefinição de senha local
├── (tabs)/
│   ├── _layout.js              # Bottom Tabs (Personagens, Compêndio, Monstros, Dados, Perfil)
│   ├── index.js                # TELA 04: Meus Personagens (busca, barra de PV e exclusão)
│   ├── compendium.js           # TELA 05: Compêndio D&D 5e (Magias por nível/classe/recolhíveis, Itens, Raças e Classes)
│   ├── monsters.js             # TELA 06: Bestiário (API /monsters, busca, filtros de ND e favoritos)
│   ├── dice.js                 # TELA 07: Rolador de Dados (d4-d100, mod, críticos e histórico)
│   └── profile.js              # TELA 08: Perfil do Jogador (estatísticas, favoritos, reset demo e logout)
├── create/
│   ├── _layout.js              # Stack de criação de ficha
│   ├── step1-identity.js       # TELA 09: Passo 1 (Nome, Antecedente, Raça e Classe reais da API)
│   └── step2-attributes.js     # TELA 10: Passo 2 (Point Buy, bônus raciais da API, PV inicial e salvar)
├── character/
│   └── [id]/
│       ├── _layout.js          # Tabs internas da ficha (Ficha, Armas, Inventário, Grimório)
│       ├── index.js            # TELA 11: Visão Geral (PV +/-, Evolução Nv. 1-20, StatBox, Salvaguardas, Perícias, Traços e Habilidades)
│       ├── weapons.js          # TELA 12: Armas & Ataques (armas do inventário com rolagem imediata de Ataque, Dano e 2 Mãos)
│       ├── inventory.js        # TELA 13: Mochila & Equipamentos (moedas, carga e modal da API)
│       └── spells.js           # TELA 14: Grimório & Magias (slots até 9º círculo, rolagem de dano/cura e modal "Aprender Magia")
├── details/
│   └── api-item.js             # TELA 15: Detalhes do Compêndio (Magia, Equipamento com rolagem de dano, Raça ou Classe)
└── monster/
    └── [index].js              # TELA 16: Stat Block Completo do Monstro (API /monsters/{index})

src/
├── theme/colors.js             # Paleta Dark Fantasy, espaçamentos e limites responsivos
├── services/
│   ├── dndApi.js               # Serviço de consumo da https://www.dnd5eapi.co/api
│   └── storage.js              # Persistência local completa com AsyncStorage
├── utils/
│   └── dndRules.js             # Regras D&D 5e (modificadores, proficiência, PV, Point Buy, ND, parser de dados de dano)
└── components/
    ├── CustomButton.js         # Botão reutilizável com variantes Dark Fantasy
    ├── CustomInput.js          # Input estilizado com ícone, limpar e exibir senha
    ├── StatBox.js              # Caixa de atributo D&D clicável para rolagem imediata
    ├── QuickRollModal.js       # Modal de rolagem imediata na própria tela (com botão de Dano e Dano Crítico)
    └── LoadingView.js          # Estado padronizado de carregamento e erro com retry

eas.json                        # Configuração de perfis EAS Build (development, preview, production)
```

---

## Mapa das 16 Telas Implementadas

| # | Tela | Rota | Destaques |
| :-: | :--- | :--- | :--- |
| 01 | Login + Conta Demo | `app/(auth)/login.js` | Validação no `AsyncStorage` e acesso rápido com conta demo pré-populada. |
| 02 | Cadastro de Conta | `app/(auth)/register.js` | Criação de conta local persistida no dispositivo. |
| 03 | Recuperar/Redefinir Senha | `app/(auth)/forgot-password.js` | Busca por e-mail local e redefinição de senha. |
| 04 | Meus Personagens | `app/(tabs)/index.js` | Listagem dinâmica, barra de busca, barra de PV e exclusão com confirmação. |
| 05 | Compêndio D&D 5e | `app/(tabs)/compendium.js` | Magias agrupadas por nível (A–Z) com seções recolhíveis e filtro por classe conjuradora; Equipamentos, Raças e Classes. |
| 06 | Bestiário / Monstros | `app/(tabs)/monsters.js` | Lista `/api/monsters`, busca, filtros de ND (Baixo/Médio/Alto), Favoritos e estrela no `AsyncStorage`. |
| 07 | Rolador de Dados | `app/(tabs)/dice.js` | Dados poliedrais (`d4`–`d100`), quantidade, modificador, críticos e histórico salvo. |
| 08 | Perfil do Jogador | `app/(tabs)/profile.js` | Estatísticas locais, atalho para monstros favoritos, restaurar dados demo e logout. |
| 09 | Criação — Passo 1 | `app/create/step1-identity.js` | Nome, antecedente, seleção de Raça e Classe da API com prévia de traços e proficiências. |
| 10 | Criação — Passo 2 | `app/create/step2-attributes.js` | *Point Buy* (27 pts), bônus raciais automáticos, cálculo de PV/CA inicial e salvamento. |
| 11 | Ficha — Visão Geral | `app/character/[id]/index.js` | PV interativo (`+/-`), **Evolução de Nível (1–20)** com PV/ASI/habilidades, rolagem imediata em Atributos, Salvaguardas e Perícias, e modal de descrição para Traços Raciais e Habilidades de Classe. |
| 12 | Ficha — Armas & Ataques | `app/character/[id]/weapons.js` | Lista armas do inventário com cálculo automático de FOR/DES/*Finesse*, rolagem imediata de Ataque, Dano, Duas Mãos e Dano Crítico. |
| 13 | Ficha — Inventário | `app/character/[id]/inventory.js` | Moedas (`PO/PP/PC`), barra de carga (`FOR × 15 lb`), equipar itens e modal para adicionar equipamentos da API. |
| 14 | Ficha — Grimório & Magias | `app/character/[id]/spells.js` | Espaços de magia até o 9º círculo, magias conhecidas agrupadas por nível (A–Z) com rolagem imediata de Ataque/Dano/Cura e modal **"Aprender Magia"** com filtro por classe. |
| 15 | Detalhes do Compêndio | `app/details/api-item.js` | Exibição completa de Magia, Equipamento (com botão de rolagem de dano imediata), Raça ou Classe. |
| 16 | Stat Block do Monstro | `app/monster/[index].js` | Stat Block completo (`/api/monsters/{index}`), atributos, resistências, ações, ações lendárias, favoritar e atalhos de rolagem. |

---

## Histórico de Evoluções (Pós-`v1.0.0`)

- **`v1.0.0`**: Entrega completa do escopo base (44 commits sequenciais, 15 telas originais, API D&D 5e e `AsyncStorage`).
- **`v1.1.0`**: Organização do Compêndio de Magias por nível e ordem alfabética (A–Z), filtro por classe conjuradora e seções recolhíveis.
- **`v1.2.0`**: Nova aba **Armas & Ataques**, modal de rolagem imediata na própria tela (`QuickRollModal`) para perícias, atributos, armas e magias, com botões de **Rolar Dano** e **Dano Crítico** direto após o ataque.
- **`v1.3.0`**: Rolagem dedicada para as 6 **Salvaguardas**, sistema de **Evolução de Personagem (Níveis 1–20)** com ganho de PV, ASI (+2), desbloqueio de habilidades e espaços de magia até o 9º círculo, além de descrições oficiais ao tocar em Traços Raciais e Habilidades de Classe.
- **`v1.3.1`**: Configuração do **EAS Build** (`eas.json`) e `expo-dev-client` para builds Android de desenvolvimento e preview.
- **`v1.4.0`**: Padronização da aba de magias da ficha com modal **"Aprender Magia"** e agrupamento por nível, ordem alfabética, filtro por classe e seções recolhíveis tanto nas magias conhecidas quanto nas disponíveis.
- **`v1.4.1`**: Correção da montagem inicial do `<Stack>` raiz (`useRootNavigationState`) no Android nativo para o Expo Dev Build.
- **`v1.4.2`**: Atualização completa da documentação no `README`.
- **`v1.4.3`**: Correção de SafeArea inferior no Android (botões de navegação do sistema) e ajuste de escala compacta para telas menores.
- **`v1.4.4`**: Publicação do link oficial de download/instalação do APK Android (`preview` EAS Build) no `README`.

---

## Como Executar e Gerar Build

```bash
# 1. Entrar na pasta do projeto
cd p2-aplicativos-hibridos

# 2. Instalar dependências
npm install

# 3. Iniciar o servidor Expo (Mobile / Web)
npm start
```

- **Navegador (Web):** pressione **`w`** no terminal após `npm start` (ou rode `npm run web`).
- **Celular via Expo Go:** escaneie o QR Code exibido no terminal.
- **Celular via Development Build (APK gerado pelo EAS):**
  ```bash
  # Gerar APK de desenvolvimento na nuvem Expo
  eas build --profile development --platform android

  # Iniciar o Metro em modo Dev Client (use --tunnel se o firewall bloquear a rede local)
  npx expo start --dev-client -c
  ```
- **APK Standalone para testes sem PC (Preview):**
  ```bash
  eas build --profile preview --platform android
  ```
- **Acesso rápido para avaliação:** na tela de Login, toque em **"Entrar com Conta Demo"** para carregar automaticamente 2 fichas completas (*Thalion Estrela-Prateada* e *Kaelen Punho-de-Ferro*) e monstros favoritos.

> **Nota sobre persistência:** como o armazenamento utiliza `AsyncStorage`, contas e fichas são salvas localmente em cada dispositivo (não há sincronização em nuvem entre aparelhos diferentes).
