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

interface CenarioSensibilidade {
  investimento: number
  lucro: number
  elasticidade: number
}

interface ResultadoOtimizacao {
  investimento_otimo: number
  lucro_projetado: number
  is_maximo: boolean
  elasticidade_usada: number
  constante_k_usada: number
  derivada_segunda_valor: number
  alerta_risco?: string | null
  pontos_curva?: PontoGrafico[]
  cenario_pessimista?: CenarioSensibilidade
  cenario_otimista?: CenarioSensibilidade
  nivel_extrapolacao?:
    | 'dentro_da_faixa'
    | 'extrapolacao_moderada'
    | 'extrapolacao_alta'
  max_investimento_historico?: number
  erro?: string
}

interface RespostaUpload {
  elasticidade: number
  constante_k: number
  r_squared?: number
  aviso_dados?: string | null
  max_investimento_historico?: number
  erro?: string
}

function App() {
  const [k, setK] = useState<number>(1)
  const [e, setE] = useState<number>(0.11)
  const [margem, setMargem] = useState<number>(50)
  const [resultado, setResultado] = useState<ResultadoOtimizacao | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [avisoUpload, setAvisoUpload] = useState<string | null>(null)

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

      if (res.data.erro) {
        alert(`Erro: ${res.data.erro}`)
        return
      }

      setE(res.data.elasticidade)
      setK(res.data.constante_k)
      setAvisoUpload(res.data.aviso_dados || null)

      let mensagem = `Dados processados!\nElasticidade: ${res.data.elasticidade?.toFixed(
        4
      )}\nR²: ${res.data.r_squared?.toFixed(4)}`
      if (res.data.aviso_dados) {
        mensagem += `\n\n⚠️ ${res.data.aviso_dados}`
      }
      alert(mensagem)
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
      console.log('Enviando /calcular com:', { margem, k, e })
      const res = await axios.post<ResultadoOtimizacao>(
        'http://127.0.0.1:8000/calcular',
        {
          margem: margem,
          k: k,
          e: e,
        }
      )
      console.log('Resposta recebida:', res.data)

      if (res.data.erro) {
        alert(`Erro: ${res.data.erro}`)
        return
      }

      setResultado(res.data)

      if (res.data.alerta_risco) {
        alert(`⚠️ ${res.data.alerta_risco}`)
      }
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
        {/* Aviso de Upload */}
        {avisoUpload && (
          <div
            style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              padding: '16px',
              marginBottom: '40px',
              fontSize: '0.9em',
              color: '#856404',
              lineHeight: '1.6',
            }}
          >
            <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
              ⚠️ Aviso sobre os dados
            </p>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{avisoUpload}</p>
          </div>
        )}

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

            {/* Cabeçalho de Recomendação */}
            <div
              style={{
                background: '#f0f7ff',
                border: '2px solid #2196f3',
                borderRadius: '8px',
                padding: '20px',
                marginBottom: '40px',
              }}
            >
              <p
                style={{
                  fontSize: '0.85em',
                  color: '#1565c0',
                  margin: '0 0 8px 0',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                }}
              >
                ✓ Análise Concluída
              </p>
              <p
                style={{
                  fontSize: '1.1em',
                  color: '#000000',
                  margin: 0,
                  fontWeight: '600',
                }}
              >
                Recomendação Técnica (Cenário Base):
              </p>
              <p
                style={{
                  fontSize: '0.9em',
                  color: '#666666',
                  margin: '8px 0 0 0',
                  lineHeight: '1.5',
                }}
              >
                Invista{' '}
                <strong>
                  R${' '}
                  {resultado.investimento_otimo.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </strong>{' '}
                para maximizar lucros. Faixas de sensibilidade mostradas abaixo
                baseadas em variações da elasticidade (±10%).
              </p>
            </div>

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

            {/* --- LEGENDA DO GRÁFICO --- */}
            {resultado.pontos_curva && (
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  marginBottom: '20px',
                  flexWrap: 'wrap',
                  padding: '16px',
                  background: '#f9f9f9',
                  borderRadius: '6px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '2px',
                      background: '#cccccc',
                      borderTop: '2px dashed #cccccc',
                    }}
                  />
                  <span style={{ fontSize: '0.85em', color: '#666666' }}>
                    Máximo Histórico
                  </span>
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '2px',
                      background: '#2196f3',
                      borderTop: '2px dashed #2196f3',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '0.85em',
                      color: '#1565c0',
                      fontWeight: '600',
                    }}
                  >
                    Recomendação Técnica
                  </span>
                </div>
              </div>
            )}

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
                    {/* Linha do máximo histórico */}
                    {resultado.max_investimento_historico && (
                      <ReferenceLine
                        x={resultado.max_investimento_historico}
                        stroke="#cccccc"
                        strokeDasharray="3 3"
                        strokeWidth={2}
                        label={{
                          value: 'Máx. Histórico',
                          position: 'top',
                          fill: '#999999',
                          fontSize: '0.8em',
                        }}
                      />
                    )}
                    {/* Linha do investimento ótimo */}
                    <ReferenceLine
                      x={resultado.investimento_otimo}
                      stroke="#2196f3"
                      strokeDasharray="5 5"
                      strokeWidth={2.5}
                      label={{
                        value: 'Recomendação',
                        position: 'top',
                        fill: '#1565c0',
                        fontSize: '0.8em',
                        fontWeight: 'bold',
                      }}
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
              {/* Alertas de Risco */}
              {resultado.alerta_risco && (
                <div
                  style={{
                    background: '#fff3cd',
                    border: '1px solid #ffeaa7',
                    borderRadius: '4px',
                    padding: '16px',
                    marginBottom: '24px',
                    fontSize: '0.9em',
                    color: '#856404',
                    lineHeight: '1.6',
                  }}
                >
                  <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>
                    ⚠️ Aviso Importante
                  </p>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {resultado.alerta_risco}
                  </p>
                </div>
              )}

              {/* Badges de Risco */}
              {resultado.nivel_extrapolacao && (
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '24px',
                    flexWrap: 'wrap',
                  }}
                >
                  {resultado.nivel_extrapolacao === 'dentro_da_faixa' && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#e8f5e9',
                        border: '1px solid #4caf50',
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontSize: '0.9em',
                        fontWeight: '600',
                        color: '#2d5016',
                      }}
                    >
                      🟢 Dentro da Faixa Histórica
                    </div>
                  )}
                  {resultado.nivel_extrapolacao === 'extrapolacao_moderada' && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontSize: '0.9em',
                        fontWeight: '600',
                        color: '#856404',
                      }}
                    >
                      🟡 Extrapolação Moderada
                    </div>
                  )}
                  {resultado.nivel_extrapolacao === 'extrapolacao_alta' && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#ffebee',
                        border: '1px solid #f44336',
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontSize: '0.9em',
                        fontWeight: '600',
                        color: '#7d2323',
                      }}
                    >
                      🔴 Extrapolação Alta
                    </div>
                  )}
                </div>
              )}

              {/* Análise de Sensibilidade - Cenários */}
              {resultado.cenario_pessimista && resultado.cenario_otimista && (
                <div
                  style={{
                    background: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    padding: '20px',
                    marginBottom: '24px',
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.95em',
                      fontWeight: '600',
                      color: '#000000',
                      marginTop: 0,
                      marginBottom: '16px',
                    }}
                  >
                    📊 Análise de Sensibilidade
                  </p>
                  <p
                    style={{
                      fontSize: '0.85em',
                      color: '#666666',
                      margin: '0 0 16px 0',
                      fontStyle: 'italic',
                    }}
                  >
                    Como a incerteza na elasticidade (±10%) afeta a
                    recomendação:
                  </p>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '16px',
                    }}
                  >
                    {/* Cenário Pessimista */}
                    <div
                      style={{
                        background: '#fff5f5',
                        border: '1px solid #ffcdd2',
                        borderRadius: '4px',
                        padding: '14px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.8em',
                          color: '#c62828',
                          margin: '0 0 8px 0',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}
                      >
                        Cenário Pessimista
                      </p>
                      <p
                        style={{
                          fontSize: '0.75em',
                          color: '#888888',
                          margin: '0 0 4px 0',
                        }}
                      >
                        Elasticidade -10%
                      </p>
                      <p
                        style={{
                          fontSize: '1.1em',
                          fontWeight: '600',
                          color: '#000000',
                          margin: '4px 0',
                        }}
                      >
                        R${' '}
                        {resultado.cenario_pessimista.investimento.toLocaleString(
                          'pt-BR',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                      <p
                        style={{
                          fontSize: '0.8em',
                          color: '#666666',
                          margin: '8px 0 0 0',
                          borderTop: '1px solid #ffcdd2',
                          paddingTop: '8px',
                        }}
                      >
                        Lucro: R${' '}
                        {resultado.cenario_pessimista.lucro.toLocaleString(
                          'pt-BR',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>

                    {/* Cenário Base */}
                    <div
                      style={{
                        background: '#f0f7ff',
                        border: '2px solid #2196f3',
                        borderRadius: '4px',
                        padding: '14px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.8em',
                          color: '#1565c0',
                          margin: '0 0 8px 0',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}
                      >
                        Cenário Base (Recomendado)
                      </p>
                      <p
                        style={{
                          fontSize: '0.75em',
                          color: '#888888',
                          margin: '0 0 4px 0',
                        }}
                      >
                        Elasticidade ={' '}
                        {resultado.elasticidade_usada?.toFixed(4)}
                      </p>
                      <p
                        style={{
                          fontSize: '1.1em',
                          fontWeight: '600',
                          color: '#000000',
                          margin: '4px 0',
                        }}
                      >
                        R${' '}
                        {resultado.investimento_otimo.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p
                        style={{
                          fontSize: '0.8em',
                          color: '#666666',
                          margin: '8px 0 0 0',
                          borderTop: '1px solid #90caf9',
                          paddingTop: '8px',
                        }}
                      >
                        Lucro: R${' '}
                        {resultado.lucro_projetado.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                    </div>

                    {/* Cenário Otimista */}
                    <div
                      style={{
                        background: '#f1f8e9',
                        border: '1px solid #c6e6b7',
                        borderRadius: '4px',
                        padding: '14px',
                      }}
                    >
                      <p
                        style={{
                          fontSize: '0.8em',
                          color: '#558b2f',
                          margin: '0 0 8px 0',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}
                      >
                        Cenário Otimista
                      </p>
                      <p
                        style={{
                          fontSize: '0.75em',
                          color: '#888888',
                          margin: '0 0 4px 0',
                        }}
                      >
                        Elasticidade +10%
                      </p>
                      <p
                        style={{
                          fontSize: '1.1em',
                          fontWeight: '600',
                          color: '#000000',
                          margin: '4px 0',
                        }}
                      >
                        R${' '}
                        {resultado.cenario_otimista.investimento.toLocaleString(
                          'pt-BR',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                      <p
                        style={{
                          fontSize: '0.8em',
                          color: '#666666',
                          margin: '8px 0 0 0',
                          borderTop: '1px solid #c6e6b7',
                          paddingTop: '8px',
                        }}
                      >
                        Lucro: R${' '}
                        {resultado.cenario_otimista.lucro.toLocaleString(
                          'pt-BR',
                          {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
