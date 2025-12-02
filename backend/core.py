# backend/core.py
import sympy as sp
import pandas as pd
import numpy as np
import statsmodels.api as sm
from scipy.optimize import fminbound

def calcular_elasticidade(arquivo_csv):
    # Lê o CSV e faz regressão Log-Log para achar 'e' (elasticidade)
    df = pd.read_csv(arquivo_csv)

    # Filtra zeros para evitar erro de log
    df = df[(df['investimento'] > 0) & (df['vendas'] > 0)]

    # ln(Vendas) = ln(k) + e * ln(Investimento)
    Y = np.log(df['vendas'])
    X = sm.add_constant(np.log(df['investimento']))

    modelo = sm.OLS(Y, X).fit()
    e = modelo.params['investimento'] # Coeficiente angular
    k = np.exp(modelo.params['const'])

    return e, k

def otimizar_investimento(margem_unitaria, k, e):
    """
    Otimiza o investimento usando método numérico (mais robusto que simbólico)
    """
    # Definir a função de lucro
    def lucro(A):
        if A <= 0:
            return -1e10
        Q = k * (A ** e)
        G = margem_unitaria * Q
        return G - A

    # Negamos porque fminbound minimiza
    def neg_lucro(A):
        return -lucro(A)

    # Definir limites de busca
    # Se e for muito negativo, o A ótimo será pequeno
    # Se e for positivo, pode ser maior
    a_min = 0.001
    a_max = max(10000, 1000 * abs(k)) if k > 0 else 10000

    try:
        # Usar método numérico robusto
        a_otimo = fminbound(neg_lucro, a_min, a_max, full_output=False, xtol=1e-6)
        lucro_max = lucro(a_otimo)

        # Estimar se é máximo calculando a segunda derivada numericamente
        h = 1e-5
        f_a = lucro(a_otimo)
        f_plus = lucro(a_otimo + h)
        f_minus = lucro(a_otimo - h)
        d2 = (f_plus - 2*f_a + f_minus) / (h**2)
        is_maximo = d2 < 0

    except Exception as ex:
        print(f"Erro na otimização: {ex}")
        return None

    # Gerar pontos da curva para o gráfico
    a_min_graph = 0.001
    a_max_graph = max(a_otimo * 1.5, 1000)

    investimentos = np.linspace(a_min_graph, a_max_graph, 100)
    lucros = [lucro(a) for a in investimentos]

    pontos_curva = [
        {"investimento": float(inv), "lucro": float(lucro_val)}
        for inv, lucro_val in zip(investimentos, lucros)
    ]

    return {
        "investimento_otimo": float(a_otimo),
        "lucro_projetado": float(lucro_max),
        "is_maximo": bool(is_maximo),
        "elasticidade_usada": float(e),
        "pontos_curva": pontos_curva
    }
