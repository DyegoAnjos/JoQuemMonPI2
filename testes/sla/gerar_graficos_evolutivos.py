import json
import os
import pandas as pd
import matplotlib.pyplot as plt

def carregar_metrica(caminho_json, metrica_alvo):
    if not os.path.exists(caminho_json):
        print(f"Arquivo não encontrado: {caminho_json}")
        return pd.Series(dtype=float)

    registros = []
    with open(caminho_json, 'r', encoding='utf-8') as f:
        for linha in f:
            try:
                dado = json.loads(linha)
                if dado.get('type') == 'Point' and dado.get('metric') == metrica_alvo:
                    registros.append({
                        'timestamp': pd.to_datetime(dado['data']['time']),
                        'valor': dado['data']['value']
                    })
            except json.JSONDecodeError:
                continue

    if not registros:
        return pd.Series(dtype=float)

    df = pd.DataFrame(registros)
    t0 = df['timestamp'].min()
    df['janela_5s'] = (((df['timestamp'] - t0).dt.total_seconds()).astype(int) // 5) * 5

    if metrica_alvo == 'http_req_duration':
        return df.groupby('janela_5s')['valor'].mean()
    elif metrica_alvo == 'http_reqs':
        return df.groupby('janela_5s')['valor'].sum() / 5.0
    elif metrica_alvo == 'vus':
        return df.groupby('janela_5s')['valor'].max()
    return pd.Series(dtype=float)

antes_json = 'resultado_cadastro_antes.json'
depois_json = 'resultado_cadastro_depois.json'

lat_antes = carregar_metrica(antes_json, 'http_req_duration')
lat_depois = carregar_metrica(depois_json, 'http_req_duration')
vaz_antes = carregar_metrica(antes_json, 'http_reqs')
vaz_depois = carregar_metrica(depois_json, 'http_reqs')

os.makedirs('../../docs/sla', exist_ok=True)

fig, ax = plt.subplots(1, 2, figsize=(12, 4.8))
fig.suptitle('Evolução do Serviço POST /auth.php — Antes vs. Depois da Otimização', fontsize=13, fontweight='bold')

if not lat_antes.empty:
    ax[0].plot(lat_antes.index, lat_antes.values, label='Antes (ORDER BY RAND())', linestyle='--', color='#c62828', marker='o')
if not lat_depois.empty:
    ax[0].plot(lat_depois.index, lat_depois.values, label='Depois (Shuffle em Memória)', color='#1565c0', marker='s')
ax[0].set_title('Latência Média (ms)')
ax[0].set_xlabel('Tempo (s)')
ax[0].set_ylabel('ms')
ax[0].legend()
ax[0].grid(True, linestyle='--', alpha=0.5)

if not vaz_antes.empty:
    ax[1].plot(vaz_antes.index, vaz_antes.values, label='Antes (ORDER BY RAND())', linestyle='--', color='#c62828', marker='o')
if not vaz_depois.empty:
    ax[1].plot(vaz_depois.index, vaz_depois.values, label='Depois (Shuffle em Memória)', color='#1565c0', marker='s')
ax[1].set_title('Vazão (req/s)')
ax[1].set_xlabel('Tempo (s)')
ax[1].set_ylabel('req/s')
ax[1].legend()
ax[1].grid(True, linestyle='--', alpha=0.5)

plt.tight_layout()
plt.savefig('../../docs/sla/grafico_evolutivo_cadastro.png', dpi=150)
plt.close()

print("Gráfico evolutivo salvo em docs/sla/grafico_evolutivo_cadastro.png")
if not lat_antes.empty and not lat_depois.empty:
    print(f"Latência média Antes: {lat_antes.mean():.2f} ms | Depois: {lat_depois.mean():.2f} ms")
if not vaz_antes.empty and not vaz_depois.empty:
    print(f"Vazão média Antes: {vaz_antes.mean():.2f} req/s | Depois: {vaz_depois.mean():.2f} req/s")