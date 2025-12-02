# backend/main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core import calcular_elasticidade, otimizar_investimento
import shutil
import os
import traceback

app = FastAPI()

# Permitir que o React acesse o Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoint de teste
@app.get("/teste")
def teste():
    return {"status": "Backend funcionando!"}

class DadosCalculo(BaseModel):
    margem: float
    k: float
    e: float

class DadosCalculoSimples(BaseModel):
    margem_unitaria: float
    lucro_bruto: float
    investimento: float

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    with open("temp.csv", "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    resultado = calcular_elasticidade("temp.csv")

    if "erro" in resultado:
        return {"erro": resultado["erro"]}

    return {
        "elasticidade": resultado["elasticidade"],
        "constante_k": resultado["constante_k"],
        "r_squared": resultado["r_squared"],
        "aviso_dados": resultado["aviso_dados"],
        "max_investimento_historico": resultado["max_investimento_historico"]
    }

@app.post("/calcular")
def calcular(dados: DadosCalculo):
    try:
        print(f"DEBUG /calcular: margem={dados.margem}, k={dados.k}, e={dados.e}")
        resultado = otimizar_investimento(dados.margem, dados.k, dados.e)
        print(f"DEBUG resultado: {resultado}")
        return resultado
    except Exception as ex:
        print(f"ERROR /calcular: {str(ex)}")
        traceback.print_exc()
        return {"erro": str(ex)}

@app.post("/calcular-simples")
def calcular_simples(dados: DadosCalculoSimples):
    """Endpoint simplificado: calcula otimização direto de lucro_bruto e investimento"""
    try:
        print(f"DEBUG /calcular-simples: margem={dados.margem_unitaria}, lucro={dados.lucro_bruto}, inv={dados.investimento}")

        # Estima k baseado no ponto atual (e = 0.5 por padrão)
        e_default = 0.5
        if dados.investimento <= 0:
            return {"erro": "Investimento deve ser positivo"}

        k = dados.lucro_bruto / (dados.investimento ** e_default)
        print(f"DEBUG k calculado: {k}")

        resultado = otimizar_investimento(dados.margem_unitaria, k, e_default, max_historico=dados.investimento)
        print(f"DEBUG resultado: {resultado}")
        return resultado
    except Exception as ex:
        print(f"ERROR /calcular-simples: {str(ex)}")
        traceback.print_exc()
        return {"erro": str(ex)}
