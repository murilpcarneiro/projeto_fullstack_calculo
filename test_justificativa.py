#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Script para testar a seção de justificativa matemática"""

import requests
import json

# Testar endpoint de cálculo simples
print("=" * 80)
print("TESTE 1: Cálculo Simples (sem CSV)")
print("=" * 80)

payload = {
    "margem": 50,
    "k": 1.5,
    "e": 0.5
}

try:
    response = requests.post("http://127.0.0.1:8000/calcular", json=payload)
    data = response.json()

    if "erro" in data:
        print(f"❌ Erro: {data['erro']}")
    else:
        print("✅ Resposta recebida com sucesso!")
        print("\n📊 JUSTIFICATIVA MATEMÁTICA:")
        print("-" * 80)

        if "justificativa" in data:
            just = data["justificativa"]
            print(f"\n🔹 Título: {just.get('titulo', 'N/A')}\n")

            print("📋 ETAPAS:")
            for etapa in just.get("etapas", []):
                print(f"\n  {etapa['numero']}. {etapa['nome']}")
                print(f"     {etapa['descricao']}")
                if "formula" in etapa:
                    print(f"     📐 {etapa['formula']}")
                if "detalhes" in etapa:
                    for detalhe in etapa["detalhes"]:
                        print(f"        • {detalhe}")

            print("\n\n✓ RESULTADO FINAL:")
            resultado = just.get("resultado_final", {})
            print(f"  Investimento: {resultado.get('investimento_recomendado', 'N/A')}")
            print(f"  Lucro: {resultado.get('lucro_esperado', 'N/A')}")
            print(f"  Validação: {resultado.get('validacao', 'N/A')}")
            print(f"  Confiabilidade: {resultado.get('confiabilidade', 'N/A')}")
        else:
            print("⚠️  Nenhuma justificativa retornada!")

        # Mostrar também os valores principais
        print("\n\n📈 VALORES PRINCIPAIS:")
        print(f"  Investimento Ótimo: R$ {data.get('investimento_otimo', 'N/A'):.2f}")
        print(f"  Lucro Projetado: R$ {data.get('lucro_projetado', 'N/A'):.2f}")
        print(f"  Derivada Primeira: {data.get('derivada_primeira_valor', 'N/A'):.6f}")
        print(f"  Derivada Segunda: {data.get('derivada_segunda_valor', 'N/A'):.6f}")

except requests.exceptions.ConnectionError:
    print("❌ Não foi possível conectar ao servidor Backend!")
    print("   Certifique-se de que o Backend está rodando em http://127.0.0.1:8000")
except Exception as e:
    print(f"❌ Erro: {str(e)}")

print("\n" + "=" * 80)
print("FIM DO TESTE")
print("=" * 80)
