import json
import os
import pandas as pd
import matplotlib.pyplot as plt

def processar_k6_json(caminho_json):
    registros = []
    if not os.path.exists(caminho_json):
        print(f"Aviso: Arquivo {caminho_json} não encontrado.")
        return pd.DataFrame()
        
    with open(caminho_json, 'r', encoding='utf-8') as f:
        for linha in f:
            try:
                dado = json.loads(linha)
                if dado.get('type') == 'Point':
                    metrica = dado['metric']
                    if metrica in ('http_req_duration', 'http_reqs', 'vus', 'http_req_failed'):
                        registros.append({
                            'metrica': metrica,
                            'timestamp': pd.to_datetime(dado['data']['time']),
                            'valor': dado['data']['value']
                        })
            except json.JSONDecodeError:
                continue
                
    if not registros:
        return pd.DataFrame()
        
    df = pd.DataFrame(registros)
    t0 = df['timestamp'].min()
    df['segundo'] = ((df['timestamp'] - t0).dt.total_seconds()).astype(int)
    df['janela_5s'] = (df['segundo'] // 5) * 5
    return df

def gerar_painel_servico(df, titulo, arquivo_saida):
    if df.empty:
        print(f"Não foi possível gerar gráficos para {titulo} (dados vazios).")
        return

    latencia = df[df['metrica'] == 'http_req_duration'].groupby('janela_5s')['valor'].mean()
    vazao = df[df['metrica'] == 'http_reqs'].groupby('janela_5s')['valor'].sum() / 5.0
    vus = df[df['metrica'] == 'vus'].groupby('janela_5s')['valor'].max()

    fig, axes = plt.subplots(3, 1, figsize=(10, 10), sharex=True)
    fig.suptitle(titulo, fontsize=14, fontweight='bold')

    axes[0].plot(vus.index, vus.values, color='#3b4cca', marker='o')
    axes[0].set_ylabel('Concorrência (VUs)')
    axes[0].grid(True, linestyle='--', alpha=0.5)

    axes[1].plot(latencia.index, latencia.values, color='#e3350d', marker='s')
    axes[1].set_ylabel('Latência Média (ms)')
    axes[1].grid(True, linestyle='--', alpha=0.5)

    axes[2].plot(vazao.index, vazao.values, color='#2e7d32', marker='^')
    axes[2].set_ylabel('Vazão (req/s)')
    axes[2].set_xlabel('Tempo de Execução (s)')
    axes[2].grid(True, linestyle='--', alpha=0.5)

    os.makedirs(os.path.dirname(arquivo_saida), exist_ok=True)
    plt.tight_layout()
    plt.savefig(arquivo_saida, dpi=150)
    plt.close()

    print(f"=== {titulo} ===")
    print(f"Latência média geral: {df[df['metrica']=='http_req_duration']['valor'].mean():.2f} ms")
    print(f"Vazão média: {vazao.mean():.2f} req/s")
    print(f"Concorrência máxima: {vus.max():.0f} VUs\n")

# Processa os dados
df_cartas = processar_k6_json('resultado_cartas.json')
df_cadastro = processar_k6_json('resultado_cadastro.json')

# Garante que a pasta de destino dos gráficos exista
os.makedirs('../../docs/sla', exist_ok=True)

gerar_painel_servico(df_cartas, 'Serviço 1: GET /cartas.php (Leitura)', '../../docs/sla/grafico_cartas.png')
gerar_painel_servico(df_cadastro, 'Serviço 2: POST /auth.php (Escrita)', '../../docs/sla/grafico_cadastro.png')

# Gráfico comparativo lado a lado
if not df_cartas.empty and not df_cadastro.empty:
    fig, ax = plt.subplots(1, 2, figsize=(11, 4.5))
    lat_c = df_cartas[df_cartas['metrica'] == 'http_req_duration'].groupby('janela_5s')['valor'].mean()
    lat_a = df_cadastro[df_cadastro['metrica'] == 'http_req_duration'].groupby('janela_5s')['valor'].mean()
    ax[0].plot(lat_c.index, lat_c.values, label='GET /cartas.php', color='#3b4cca')
    ax[0].plot(lat_a.index, lat_a.values, label='POST /auth.php', color='#e3350d')
    ax[0].set_title('Comparação de Latência Média (ms)')
    ax[0].set_xlabel('Tempo (s)')
    ax[0].set_ylabel('ms')
    ax[0].legend()
    ax[0].grid(True, linestyle='--', alpha=0.5)

    vaz_c = df_cartas[df_cartas['metrica'] == 'http_reqs'].groupby('janela_5s')['valor'].sum() / 5.0
    vaz_a = df_cadastro[df_cadastro['metrica'] == 'http_reqs'].groupby('janela_5s')['valor'].sum() / 5.0
    ax[1].plot(vaz_c.index, vaz_c.values, label='GET /cartas.php', color='#3b4cca')
    ax[1].plot(vaz_a.index, vaz_a.values, label='POST /auth.php', color='#e3350d')
    ax[1].set_title('Comparação de Vazão (req/s)')
    ax[1].set_xlabel('Tempo (s)')
    ax[1].set_ylabel('req/s')
    ax[1].legend()
    ax[1].grid(True, linestyle='--', alpha=0.5)

    plt.tight_layout()
    plt.savefig('../../docs/sla/grafico_comparativo.png', dpi=150)
    print("Gráfico comparativo gerado com sucesso!")