# backend/core.py
import sympy as sp
import pandas as pd
import numpy as np
import statsmodels.api as sm
from scipy.optimize import fminbound

def calcular_elasticidade(arquivo_csv):
    """
    Lê o CSV, faz a regressão Log-Log e aplica travas de segurança (Sanity Check).
    Retorna elasticidade (e), constante (k), qualidade (R²) e histórico.
    """
    try:
        df = pd.read_csv(arquivo_csv)

        # Limpeza: Garante que colunas existem e remove valores <= 0 (erro de log)
        if 'investimento' not in df.columns or 'vendas' not in df.columns:
            raise ValueError("O CSV deve ter colunas 'investimento' e 'vendas'")

        df_clean = df[(df['investimento'] > 0) & (df['vendas'] > 0)].copy()

        if len(df_clean) < 3:
            raise ValueError("CSV precisa de pelo menos 3 linhas de dados válidos (>0)")

        # Regressão Log-Log: ln(Vendas) = ln(k) + e * ln(Investimento)
        Y = np.log(df_clean['vendas'])
        X = sm.add_constant(np.log(df_clean['investimento'])) # Adiciona coluna de 1s para o intercepto

        modelo = sm.OLS(Y, X).fit()

        e_calculado = modelo.params['investimento']
        k_calculado = np.exp(modelo.params['const'])
        r_squared = modelo.rsquared

        # --- TRAVAS DE SEGURANÇA (GUARDRAILS) ---
        aviso = None
        e_final = e_calculado

        # Trava 1: Elasticidade Negativa (Gastar mais = Vender menos?)
        if e_calculado <= 0:
            e_final = 0.05  # Força um valor baixo conservador
            aviso = f"ALERTA: Seus dados indicaram elasticidade negativa ({e_calculado:.2f}). Usamos 0.05 por segurança."

        # Trava 2: Elasticidade Explosiva (Lucro Infinito?)
        elif e_calculado > 0.9:
            e_final = 0.8
            aviso = f"ALERTA: Elasticidade calculada ({e_calculado:.2f}) é implausível. Limitamos a 0.8 para o modelo não quebrar."

        # Trava 3: Dados Ruidosos (R² baixo)
        elif r_squared < 0.4:
            aviso = f"CUIDADO: Seus dados históricos são muito inconsistentes (R²={r_squared:.2f}). O resultado pode ser impreciso."

        # Identificar o teto histórico para verificar extrapolação depois
        max_investimento_historico = df_clean['investimento'].max()

        return {
            "elasticidade": float(e_final),
            "constante_k": float(k_calculado),
            "r_squared": float(r_squared),
            "aviso_dados": aviso,
            "max_investimento_historico": float(max_investimento_historico),
            "dados_grafico": df_clean.to_dict(orient='records')
        }

    except Exception as ex:
        # Se der erro (ex: CSV vazio), retorna erro tratado
        return {"erro": str(ex)}

def otimizar_investimento(margem_unitaria, k, e, max_historico=None):
    """
    Otimiza o investimento usando método numérico com TRAVAS DE SEGURANÇA.
    Valida parâmetros antes de otimizar.
    """
    try:
        # --- TRAVA 1: Validar parâmetros básicos ---
        if margem_unitaria <= 0:
            return {"erro": "Margem unitária deve ser positiva"}

        if k <= 0:
            return {"erro": "Constante k deve ser positiva"}

        if e <= 0 or e > 1:
            return {"erro": f"Elasticidade (e) deve estar entre 0 e 1. Valor recebido: {e:.4f}"}

        # --- TRAVA 2: Limitar elasticidade explosiva ---
        e_validado = e
        alerta_elasticidade = None

        if e > 0.9:
            e_validado = 0.8
            alerta_elasticidade = f"ALERTA: Elasticidade {e:.4f} é muito alta. Limitada a 0.8 para segurança."

        # Definir a função de lucro
        def lucro(A):
            if A <= 0:
                return -1e10
            Q = k * (A ** e_validado)
            G = margem_unitaria * Q
            return G - A

        # Negamos porque fminbound minimiza
        def neg_lucro(A):
            return -lucro(A)

        # Definir limites de busca
        a_min = 0.001
        a_max = max(10000, 1000 * abs(k)) if k > 0 else 10000

        # Usar método numérico robusto
        a_otimo = fminbound(neg_lucro, a_min, a_max, full_output=False, xtol=1e-6)
        lucro_max = lucro(a_otimo)

        # --- TRAVA 3: Validar resultado ---
        if a_otimo <= 0 or lucro_max <= 0:
            return {"erro": "Resultado de otimização inválido (valores não-positivos)"}

        # Estimar se é máximo calculando as derivadas numericamente
        h = 1e-5
        f_a = lucro(a_otimo)
        f_plus = lucro(a_otimo + h)
        f_minus = lucro(a_otimo - h)

        # Primeira derivada (inclinação da curva)
        d1 = (f_plus - f_minus) / (2 * h)

        # Segunda derivada (curvatura - deve ser negativa para máximo)
        d2 = (f_plus - 2*f_a + f_minus) / (h**2)
        is_maximo = d2 < 0

        # --- DERIVADAS ANALÍTICAS COM SYMPY ---
        # G(A) = margem * k * A^e - A
        # G'(A) = margem * k * e * A^(e-1) - 1
        # G''(A) = margem * k * e * (e-1) * A^(e-2)

        A_sym = sp.Symbol('A', positive=True, real=True)
        G_sym = margem_unitaria * k * (A_sym ** e_validado) - A_sym

        # Primeira derivada analítica
        G_prime = sp.diff(G_sym, A_sym)
        d1_analitica = float(G_prime.subs(A_sym, a_otimo))

        # Segunda derivada analítica
        G_double_prime = sp.diff(G_prime, A_sym)
        d2_analitica = float(G_double_prime.subs(A_sym, a_otimo))

        # --- TRAVA 4: Alerta de Extrapolação ---
        alerta_risco = None
        if max_historico and a_otimo > (max_historico * 2.0):
            alerta_risco = (
                f"ALERTA DE EXTRAPOLAÇÃO: O investimento recomendado (R$ {a_otimo:.2f}) "
                f"é mais que o dobro do seu histórico (Max: R$ {max_historico:.2f}). "
                "Recomendamos cautela e testes progressivos."
            )

        # Gerar pontos da curva para o gráfico
        a_min_graph = 0.001
        a_max_graph = max(a_otimo * 1.5, 1000)

        investimentos = np.linspace(a_min_graph, a_max_graph, 100)
        lucros = [lucro(a) for a in investimentos]

        pontos_curva = [
            {"investimento": float(inv), "lucro": float(lucro_val)}
            for inv, lucro_val in zip(investimentos, lucros)
        ]

        # --- ANÁLISE DE SENSIBILIDADE: Cenários Pessimista e Otimista ---
        # Simular variação de ±10% na elasticidade para análise de sensibilidade
        e_pessimista = max(e_validado * 0.9, 0.01)  # -10% (mais conservador)
        e_otimista = min(e_validado * 1.1, 1.0)     # +10% (mais agressivo)

        # Função genérica de lucro para qualquer elasticidade
        def calcular_lucro(A, elasticidade):
            if A <= 0:
                return -1e10
            Q = k * (A ** elasticidade)
            G = margem_unitaria * Q
            return G - A

        # Otimizar nos cenários
        a_pessimista = fminbound(lambda a: -calcular_lucro(a, e_pessimista), a_min, a_max, full_output=False, xtol=1e-6)
        lucro_pessimista_val = calcular_lucro(a_pessimista, e_pessimista)

        a_otimista = fminbound(lambda a: -calcular_lucro(a, e_otimista), a_min, a_max, full_output=False, xtol=1e-6)
        lucro_otimista_val = calcular_lucro(a_otimista, e_otimista)

        # Calcular derivadas analíticas para os cenários
        # G'(A) = margem * k * e * A^(e-1) - 1
        d1_pessimista = float((margem_unitaria * k * e_pessimista * (a_pessimista ** (e_pessimista - 1)) - 1))
        d1_otimista = float((margem_unitaria * k * e_otimista * (a_otimista ** (e_otimista - 1)) - 1))

        # Calcular nível de extrapolação
        nivel_extrapolacao = "dentro_da_faixa"
        if max_historico:
            ratio = a_otimo / max_historico
            if ratio > 1.5:
                nivel_extrapolacao = "extrapolacao_alta"
            elif ratio > 1.0:
                nivel_extrapolacao = "extrapolacao_moderada"

        # Combinar alertas
        alerta_combinado = None
        if alerta_elasticidade and alerta_risco:
            alerta_combinado = f"{alerta_elasticidade}\n{alerta_risco}"
        elif alerta_elasticidade:
            alerta_combinado = alerta_elasticidade
        elif alerta_risco:
            alerta_combinado = alerta_risco

        return {
            "investimento_otimo": float(a_otimo),
            "lucro_projetado": float(lucro_max),
            "is_maximo": bool(is_maximo),
            "elasticidade_usada": float(e_validado),
            "constante_k_usada": float(k),
            "derivada_primeira_valor": float(d1_analitica),
            "derivada_segunda_valor": float(d2_analitica),
            "alerta_risco": alerta_combinado,
            "pontos_curva": pontos_curva,
            # Análise de sensibilidade
            "cenario_pessimista": {
                "investimento": float(a_pessimista),
                "lucro": float(lucro_pessimista_val),
                "elasticidade": float(e_pessimista),
                "derivada_primeira": float(d1_pessimista)
            },
            "cenario_otimista": {
                "investimento": float(a_otimista),
                "lucro": float(lucro_otimista_val),
                "elasticidade": float(e_otimista),
                "derivada_primeira": float(d1_otimista)
            },
            "nivel_extrapolacao": nivel_extrapolacao,
            "max_investimento_historico": float(max_historico) if max_historico else None
        }

    except Exception as ex:
        return {"erro": f"Erro na otimização: {str(ex)}"}
