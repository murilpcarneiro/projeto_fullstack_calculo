# Budget Optimizer - Calculadora de Otimização de Investimento

Uma aplicação full-stack para otimização de investimento em publicidade baseada no **Teorema de Wright** e análise de elasticidade. Calcula o investimento ideal que maximiza o lucro considerando a relação entre investimento e vendas.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Tecnologias](#tecnologias)
- [Funcionalidades](#funcionalidades)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Como Usar](#como-usar)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [API Backend](#api-backend)
- [Modelos Matemáticos](#modelos-matemáticos)

## 🎯 Visão Geral

O **Budget Optimizer** é uma ferramenta que ajuda empresas e profissionais de marketing a determinar o investimento ótimo em publicidade. A aplicação utiliza dados históricos de investimento e vendas para:

1. **Calibrar um modelo econômico** através de regressão log-log
2. **Calcular a elasticidade** (sensibilidade das vendas ao investimento)
3. **Otimizar o orçamento** usando métodos numéricos para maximizar lucro

## 🛠️ Tecnologias

### Frontend
- **React 19** - Interface de usuário
- **TypeScript** - Tipagem estática
- **Vite** - Bundler e dev server
- **Axios** - Cliente HTTP
- **Recharts** - Visualização de gráficos
- **Lucide React** - Ícones

### Backend
- **FastAPI** - Framework web Python
- **Python 3.8+** - Linguagem
- **Pandas** - Manipulação de dados
- **NumPy** - Computação numérica
- **StatsModels** - Regressão estatística
- **SciPy** - Otimização numérica
- **Sympy** - Computação simbólica

## ✨ Funcionalidades

### Upload e Calibração
- 📤 Upload de arquivo CSV com dados históricos
- 🔄 Processamento automático de dados
- 📊 Cálculo de elasticidade via regressão log-log
- ✅ Validação de dados (remoção de zeros)

### Cálculo de Otimização
- 💰 Determinação do investimento ótimo
- 📈 Projeção de lucro máximo esperado
- 📉 Gráfico interativo da curva lucro vs investimento
- ✔️ Validação matemática (segunda derivada)

### Visualização
- 🎨 Interface moderna e intuitiva
- 📊 Gráfico com destaque do ponto ótimo
- 💡 Exibição de métricas principais
- 🔍 Tooltips informativos

## 📦 Pré-requisitos

### Requisitos do Sistema
- Node.js 18+ (para Frontend)
- Python 3.8+ (para Backend)
- npm ou yarn (gerenciador de pacotes)
- pip (gerenciador de pacotes Python)

## 🚀 Instalação

### 1. Clonar o Repositório
```bash
git clone <seu-repositorio>
cd projeto_fullstack_calculo
```

### 2. Configurar Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv

# Ativar ambiente virtual
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Instalar dependências
pip install fastapi uvicorn pandas numpy statsmodels scipy sympy python-multipart

# Iniciar servidor
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

O backend estará disponível em `http://127.0.0.1:8000`

### 3. Configurar Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:5173` (ou a porta indicada no terminal)

## 📖 Como Usar

### Passo 1: Preparar os Dados

Crie um arquivo CSV com as seguintes colunas:
```csv
investimento,vendas
100,500
150,650
200,750
250,820
```

**Requisitos:**
- Mínimo 2 linhas de dados
- Colunas: `investimento` e `vendas`
- Valores devem ser numéricos positivos
- Sem linhas com zero (serão filtradas automaticamente)

### Passo 2: Calibração do Modelo

1. Clique em "Escolher arquivo" na seção "Calibração do Modelo"
2. Selecione seu arquivo CSV
3. Aguarde o processamento
4. A aplicação calculará automaticamente:
   - **Elasticidade (e)**: Sensibilidade das vendas ao investimento
   - **Constante (k)**: Fator de escala do modelo

### Passo 3: Otimização

1. Ajuste a "Margem Unitária" (lucro por unidade vendida)
2. Os valores de elasticidade e constante são preenchidos automaticamente (ou ajuste manualmente)
3. Clique em "CALCULAR"
4. Visualize os resultados:
   - Investimento Ideal (R$)
   - Lucro Máximo Esperado (R$)
   - Gráfico da curva de lucro

## 📂 Estrutura do Projeto

```
projeto_fullstack_calculo/
├── backend/
│   ├── main.py              # API FastAPI e endpoints
│   ├── core.py              # Lógica de cálculo e otimização
│   ├── temp.csv             # Arquivo temporário de upload
│   └── __pycache__/         # Cache Python
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Componente principal React
│   │   ├── App.css          # Estilos da aplicação
│   │   ├── index.css        # Estilos globais
│   │   ├── main.tsx         # Ponto de entrada
│   │   └── assets/          # Imagens e recursos
│   │
│   ├── public/              # Arquivos públicos
│   ├── index.html           # HTML principal
│   ├── package.json         # Dependências npm
│   ├── vite.config.ts       # Configuração Vite
│   └── tsconfig.json        # Configuração TypeScript
│
├── dados_historicos.csv     # Exemplo de dados
└── README.md                # Este arquivo
```

## 🔌 API Backend

### Endpoints

#### POST `/upload`
Processa um arquivo CSV e calcula elasticidade.

**Request:**
```
Content-Type: multipart/form-data
file: <arquivo.csv>
```

**Response:**
```json
{
  "elasticidade": 0.5,
  "constante_k": 100
}
```

#### POST `/calcular`
Otimiza o investimento baseado nos parâmetros.

**Request:**
```json
{
  "margem": 50.0,
  "k": 100.0,
  "e": 0.5
}
```

**Response:**
```json
{
  "investimento_otimo": 1000.50,
  "lucro_projetado": 25000.00,
  "is_maximo": true,
  "elasticidade_usada": 0.5,
  "pontos_curva": [
    {"investimento": 0.001, "lucro": -1000},
    {"investimento": 500.0, "lucro": 22000},
    ...
  ]
}
```

## 📐 Modelos Matemáticos

### 1. Modelo de Função de Produção (Cobb-Douglas)

$$Q = k \cdot A^e$$

Onde:
- $Q$ = Quantidade de vendas
- $A$ = Investimento
- $e$ = Elasticidade
- $k$ = Constante de escala

### 2. Cálculo de Elasticidade (Regressão Log-Log)

Os dados são transformados em escala logarítmica:

$$\ln(Q) = \ln(k) + e \cdot \ln(A)$$

Esta é uma regressão linear onde:
- **Coeficiente angular** = elasticidade ($e$)
- **Intercepto** = $\ln(k)$

### 3. Função de Lucro

$$G(A) = m \cdot Q - A = m \cdot k \cdot A^e - A$$

Onde $m$ = margem unitária

### 4. Otimização

Para maximizar lucro, encontra-se $A^*$ tal que:

$$\frac{dG}{dA} = 0$$

A aplicação utiliza o método numérico de **minimização por bounds** (fminbound) para encontrar o máximo.

**Validação:** Segunda derivada deve ser negativa ($\frac{d^2G}{dA^2} < 0$)

## 📊 Exemplo de Uso

### Arquivo de Entrada (dados_historicos.csv)
```csv
investimento,vendas
1000,5000
1500,6500
2000,7500
2500,8200
3000,8800
```

### Processo
1. Upload do arquivo
2. Sistema calcula: $e ≈ 0.45$, $k ≈ 150$
3. Usuário define: margem = R$ 50
4. Clica em "CALCULAR"

### Saída
- **Investimento Ótimo:** R$ 2.100,00
- **Lucro Máximo:** R$ 180.000,00
- **Gráfico:** Exibe a curva de lucro com ponto máximo destacado

## ⚙️ Configuração Avançada

### Variáveis de Ambiente (Backend)

```python
# Limites de busca da otimização em core.py
a_min = 0.001        # Investimento mínimo
a_max = 10000        # Investimento máximo
```

### CORS (Compartilhamento de Recursos)

O backend permite requisições de qualquer origem:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🐛 Resolução de Problemas

### "Erro ao conectar ao servidor"
- Verifique se o backend está rodando em `http://127.0.0.1:8000`
- Verifique o console do backend para mensagens de erro

### "Erro ao processar o CSV"
- Certifique-se de que o arquivo tem as colunas `investimento` e `vendas`
- Verifique se todos os valores são numéricos e positivos
- Remova linhas com valores zero

### "Erro na otimização"
- Verifique se os parâmetros (margem, k, e) são válidos
- Valores muito extremos podem causar problemas numéricos

## 📝 Exemplo de Desenvolvimento

### Adicionar nova funcionalidade no Frontend

1. Editar `frontend/src/App.tsx`
2. Adicionar novo estado com `useState`
3. Criar função handler
4. Chamar `/calcular` ou novo endpoint conforme necessário

### Adicionar novo endpoint no Backend

1. Editar `backend/main.py`
2. Criar nova função com decorador `@app.post()` ou `@app.get()`
3. Importar funções necessárias de `core.py`
4. Testar com `curl` ou Postman

## 📄 Licença

Este projeto é fornecido como é, sem garantias. Sinta-se livre para usar e modificar.

## 👨‍💻 Autor

Desenvolvido como projeto de cálculo aplicado.

---

**Última atualização:** Dezembro 2024
