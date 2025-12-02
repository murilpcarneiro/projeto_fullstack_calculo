# backend/core.py
import sympy as sp
import pandas as pd
import numpy as np
import statsmodels.api as sm

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
    # Define variável simbólica
    A = sp.symbols('A', positive=True)

    # Equações do Relatório
    Q = k * (A**e)             # Vendas
    G = margem_unitaria * Q    # Lucro Bruto
    Lucro = G - A              # Lucro Líquido

    # Lucro = margem_unitaria * (k * (A**e)) - A

    # Derivada Primeira (SymPy)
    d1 = sp.diff(Lucro, A)

    # Encontrar onde a derivada é zero (Ponto Crítico)
    solucao = sp.solve(d1, A)

    if not solucao:
        return None

    a_otimo = float(solucao[0])
    lucro_max = float(Lucro.subs(A, a_otimo))

    # Validar com Derivada Segunda (Requisito do Edital)
    d2 = sp.diff(Lucro, A, 2)
    is_maximo = d2.subs(A, a_otimo) < 0

    return {
        "investimento_otimo": a_otimo,
        "lucro_projetado": lucro_max,
        "is_maximo": bool(is_maximo),
        "elasticidade_usada": e
    }
