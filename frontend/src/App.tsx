import axios from 'axios'
import React, { useState } from 'react'
import {
  CartesianGrid,
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
        padding: '0',
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        width: '100%',
        minHeight: '100vh',
        boxSizing: 'border-box',
        background: '#fafafa',
        color: '#1a1a1a',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#ffffff',
          borderBottom: '1px solid #e5e5e5',
          padding: '48px 80px',
        }}
      >
        <h1
          style={{
            fontSize: '2.4em',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#000000',
            letterSpacing: '-0.5px',
          }}
        >
          Budget Optimizer
        </h1>
        <p
          style={{
            fontSize: '0.95em',
            color: '#888888',
            fontWeight: '400',
            margin: '0',
          }}
        >
          Otimização de investimento em publicidade baseada no Teorema de Wright
        </p>
      </div>

      {/* Main Content */}
      <div
        style={{
          padding: '60px 80px',
        }}
      >
        {/* --- SEÇÃO DE INPUTS --- */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '50px',
            marginBottom: '60px',
          }}
        >
          {/* Card Upload */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              padding: '40px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3
              style={{
                fontWeight: '600',
                marginBottom: '16px',
                fontSize: '1.1em',
                color: '#000000',
              }}
            >
              Calibração do Modelo
            </h3>
            <p
              style={{
                fontSize: '0.9em',
                color: '#888888',
                marginBottom: '24px',
                lineHeight: '1.6',
                flex: 1,
              }}
            >
              Importe um arquivo CSV contendo dados históricos de investimento e
              vendas para calibração automática
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleUpload}
              disabled={loading}
              style={{
                fontSize: '0.9em',
                padding: '12px 14px',
                border: '1px solid #d0d0d0',
                borderRadius: '4px',
                width: '100%',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'border-color 0.2s',
                backgroundColor: '#fafafa',
              }}
            />
          </div>

          {/* Card Parâmetros */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e5e5',
              padding: '40px',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <h3
              style={{
                fontWeight: '600',
                marginBottom: '24px',
                fontSize: '1.1em',
                color: '#000000',
              }}
            >
              Parâmetros
            </h3>
            <div style={{ marginBottom: '20px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9em',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: '#333333',
                }}
              >
                Margem Unitária (R$)
              </label>
              <input
                type="number"
                value={margem}
                onChange={(ev) => setMargem(parseFloat(ev.target.value))}
                style={{
                  padding: '11px 14px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '0.95em',
                  transition: 'border-color 0.2s',
                  backgroundColor: '#fafafa',
                  color: '#1a1a1a',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#000000')}
                onBlur={(e) => (e.target.style.borderColor = '#d0d0d0')}
              />
            </div>
            <div style={{ marginBottom: '28px', flex: 1 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.9em',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: '#333333',
                }}
              >
                Elasticidade (e)
              </label>
              <input
                type="number"
                step="0.01"
                value={e}
                onChange={(ev) => setE(parseFloat(ev.target.value))}
                style={{
                  padding: '11px 14px',
                  border: '1px solid #d0d0d0',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '0.95em',
                  transition: 'border-color 0.2s',
                  backgroundColor: '#fafafa',
                  color: '#1a1a1a',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#000000')}
                onBlur={(e) => (e.target.style.borderColor = '#d0d0d0')}
              />
            </div>
            <button
              onClick={handleCalcular}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: loading ? '#e8e8e8' : '#000000',
                color: loading ? '#999999' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                fontSize: '0.95em',
                transition: 'background-color 0.2s',
                letterSpacing: '0.3px',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#1a1a1a'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#000000'
              }}
            >
              {loading ? 'CALCULANDO' : 'CALCULAR'}
            </button>
          </div>
        </div>

        {/* --- SEÇÃO DE RESULTADOS --- */}
        {resultado && (
          <div
            style={{
              background: '#ffffff',
              padding: '50px',
              borderRadius: '8px',
              border: '1px solid #e5e5e5',
            }}
          >
            <h2
              style={{
                fontSize: '1.8em',
                fontWeight: '600',
                marginBottom: '40px',
                color: '#000000',
              }}
            >
              Resultado da Otimização
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '60px',
                marginBottom: '60px',
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: '0.85em',
                    color: '#888888',
                    marginBottom: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Investimento Ideal
                </p>
                <p
                  style={{
                    fontSize: '2.8em',
                    fontWeight: '600',
                    color: '#000000',
                    margin: '0',
                  }}
                >
                  R${' '}
                  {resultado.investimento_otimo.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div>
                <p
                  style={{
                    fontSize: '0.85em',
                    color: '#888888',
                    marginBottom: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Lucro Máximo Esperado
                </p>
                <p
                  style={{
                    fontSize: '2.8em',
                    fontWeight: '600',
                    color: '#000000',
                    margin: '0',
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

            {/* --- GRÁFICO --- */}
            {resultado.pontos_curva && (
              <div
                style={{
                  height: '500px',
                  background: '#fafafa',
                  padding: '30px',
                  borderRadius: '8px',
                  marginBottom: '40px',
                  border: '1px solid #e5e5e5',
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={resultado.pontos_curva}>
                    <CartesianGrid
                      strokeDasharray="0"
                      stroke="#e5e5e5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="investimento"
                      tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                      stroke="#999999"
                      style={{ fontSize: '0.9em' }}
                    />
                    <YAxis
                      tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`}
                      stroke="#999999"
                      style={{ fontSize: '0.9em' }}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `R$ ${value.toFixed(2)}`,
                        'Lucro',
                      ]}
                      labelFormatter={(label: number) =>
                        `Investimento: R$ ${label.toFixed(2)}`
                      }
                      contentStyle={{
                        background: '#ffffff',
                        border: '1px solid #e5e5e5',
                        borderRadius: '4px',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <ReferenceLine
                      x={resultado.investimento_otimo}
                      stroke="#888888"
                      strokeDasharray="5 5"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="lucro"
                      stroke="#000000"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div
              style={{
                borderTop: '1px solid #e5e5e5',
                paddingTop: '32px',
              }}
            >
              <div style={{ marginBottom: '20px' }}>
                <p style={{ fontSize: '0.95em', margin: 0 }}>
                  <span style={{ fontWeight: '600', color: '#000000' }}>
                    Status de Validação:{' '}
                  </span>
                  <span
                    style={{
                      color: resultado.is_maximo ? '#2d5016' : '#7d2323',
                      fontWeight: '500',
                    }}
                  >
                    {resultado.is_maximo
                      ? 'Máximo confirmado (Derivada 2ª < 0)'
                      : 'Erro de otimização'}
                  </span>
                </p>
              </div>
              <p
                style={{
                  fontSize: '0.95em',
                  color: '#555555',
                  margin: 0,
                  lineHeight: '1.7',
                  fontStyle: 'italic',
                }}
              >
                O orçamento de R$ {resultado.investimento_otimo.toFixed(0)}{' '}
                representa {(resultado.elasticidade_usada * 100).toFixed(1)}% do
                lucro bruto esperado, conforme o Teorema de Wright.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
