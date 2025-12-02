import axios from 'axios'
import React, { useState } from 'react'
import {
  CartesianGrid,
  Label,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// 1. Interfaces (Tipagem)
interface PontoGrafico {
  investimento: number
  lucro: number
}

interface ResultadoOtimizacao {
  investimento_otimo: number
  lucro_projetado: number
  is_maximo: boolean
  elasticidade_usada: number
  pontos_curva?: PontoGrafico[] // Array para desenhar o gráfico
}

interface RespostaUpload {
  elasticidade: number
  constante_k: number
}

function App() {
  const [k, setK] = useState<number>(1)
  const [e, setE] = useState<number>(0.11)
  const [margem, setMargem] = useState<number>(50)
  const [resultado, setResultado] = useState<ResultadoOtimizacao | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return

    const file = event.target.files[0]
    const formData = new FormData()
    formData.append('file', file)

    try {
      setLoading(true)
      const res = await axios.post<RespostaUpload>(
        'http://127.0.0.1:8000/upload',
        formData
      )
      setE(res.data.elasticidade)
      setK(res.data.constante_k)
      alert(
        `Dados processados! Elasticidade encontrada: ${res.data.elasticidade.toFixed(
          4
        )}`
      )
    } catch (error) {
      console.error('Erro no upload', error)
      alert('Erro ao processar o CSV.')
    } finally {
      setLoading(false)
    }
  }

  const handleCalcular = async () => {
    try {
      setLoading(true)
      const res = await axios.post<ResultadoOtimizacao>(
        'http://127.0.0.1:8000/calcular',
        {
          margem: margem,
          k: k,
          e: e,
        }
      )
      setResultado(res.data)
    } catch (error) {
      console.error('Erro no cálculo', error)
      alert('Erro ao calcular o ótimo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        padding: '40px',
        fontFamily: "'JetBrains Mono', monospace",
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <h1 className="text-2xl font-bold mb-6">
        Otimizador de Budget (Teorema de Wright)
      </h1>

      {/* --- SEÇÃO DE INPUTS --- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
          marginBottom: '30px',
        }}
      >
        {/* Card Upload */}
        <div
          style={{
            border: '1px solid #ccc',
            padding: '20px',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>
            1. Calibrar Modelo
          </h3>
          <p style={{ fontSize: '0.8em', color: '#666', marginBottom: '10px' }}>
            Upload CSV (investimento, vendas)
          </p>
          <input
            type="file"
            accept=".csv"
            onChange={handleUpload}
            disabled={loading}
            style={{ fontSize: '0.9em' }}
          />
        </div>

        {/* Card Parâmetros */}
        <div
          style={{
            border: '1px solid #ccc',
            padding: '20px',
            borderRadius: '8px',
          }}
        >
          <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>
            2. Parâmetros
          </h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', fontSize: '0.9em' }}>
              Margem Unitária (R$):
            </label>
            <input
              type="number"
              value={margem}
              onChange={(ev) => setMargem(parseFloat(ev.target.value))}
              style={{
                padding: '5px',
                border: '1px solid #ddd',
                width: '100%',
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '0.9em' }}>
              Elasticidade (e):
            </label>
            <input
              type="number"
              step="0.01"
              value={e}
              onChange={(ev) => setE(parseFloat(ev.target.value))}
              style={{
                padding: '5px',
                border: '1px solid #ddd',
                width: '100%',
              }}
            />
          </div>
          <button
            onClick={handleCalcular}
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'CALCULANDO...' : 'CALCULAR ÓTIMO'}
          </button>
        </div>
      </div>

      {/* --- SEÇÃO DE RESULTADOS --- */}
      {resultado && (
        <div
          style={{
            background: '#f8f9fa',
            padding: '25px',
            borderRadius: '8px',
            border: '1px solid #dee2e6',
          }}
        >
          <h2
            style={{
              fontSize: '1.4em',
              fontWeight: 'bold',
              marginBottom: '20px',
              color: '#004085',
            }}
          >
            Resultado Otimizado
          </h2>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '30px',
            }}
          >
            <div>
              <p style={{ fontSize: '0.9em', color: '#666' }}>
                Investimento Ideal
              </p>
              <p
                style={{
                  fontSize: '1.8em',
                  fontWeight: 'bold',
                  color: '#007bff',
                }}
              >
                R${' '}
                {resultado.investimento_otimo.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.9em', color: '#666' }}>Lucro Máximo</p>
              <p
                style={{
                  fontSize: '1.8em',
                  fontWeight: 'bold',
                  color: '#28a745',
                }}
              >
                R${' '}
                {resultado.lucro_projetado.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* --- AQUI ESTÁ O GRÁFICO QUE FALTAVA --- */}
          {resultado.pontos_curva && (
            <div
              style={{
                height: '300px',
                background: 'white',
                padding: '10px',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={resultado.pontos_curva}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="investimento"
                    tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                    label={{
                      value: 'Investimento em Ads',
                      position: 'insideBottom',
                      offset: -5,
                    }}
                  />
                  <YAxis
                    label={{
                      value: 'Lucro Líquido',
                      angle: -90,
                      position: 'insideLeft',
                    }}
                    tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `R$ ${value.toFixed(2)}`,
                      'Lucro',
                    ]}
                    labelFormatter={(label: number) =>
                      `Investimento: R$ ${label.toFixed(2)}`
                    }
                  />
                  <ReferenceLine
                    x={resultado.investimento_otimo}
                    stroke="red"
                    strokeDasharray="3 3"
                  >
                    <Label
                      value="Ponto Ótimo"
                      position="top"
                      fill="red"
                      fontSize={12}
                    />
                  </ReferenceLine>
                  <Line
                    type="monotone"
                    dataKey="lucro"
                    stroke="#8884d8"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div
            style={{
              borderTop: '1px solid #ccc',
              paddingTop: '15px',
              fontSize: '0.9em',
            }}
          >
            <p>
              <strong>Status Matemático: </strong>
              {resultado.is_maximo ? (
                <span style={{ color: 'green', fontWeight: 'bold' }}>
                  MÁXIMO CONFIRMADO (Derivada 2ª &lt; 0)
                </span>
              ) : (
                <span style={{ color: 'red', fontWeight: 'bold' }}>
                  ERRO DE OTIMIZAÇÃO
                </span>
              )}
            </p>
            <p style={{ marginTop: '5px', color: '#555', fontStyle: 'italic' }}>
              "O orçamento de R$ {resultado.investimento_otimo.toFixed(0)}{' '}
              representa exatamente{' '}
              {(resultado.elasticidade_usada * 100).toFixed(1)}% do Lucro Bruto
              esperado (Teorema de Wright)."
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
