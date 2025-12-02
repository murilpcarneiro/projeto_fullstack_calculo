# backend/main.py
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from core import calcular_elasticidade, otimizar_investimento
import shutil
import os

app = FastAPI()

# Permitir que o React acesse o Python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class DadosCalculo(BaseModel):
    margem: float
    k: float
    e: float

@app.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    with open("temp.csv", "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    e, k = calcular_elasticidade("temp.csv")
    return {"elasticidade": e, "constante_k": k}

@app.post("/calcular")
def calcular(dados: DadosCalculo):
    resultado = otimizar_investimento(dados.margem, dados.k, dados.e)
    return resultado
