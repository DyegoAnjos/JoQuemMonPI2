import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 5 },   // 5 cadastros simultâneos
    { duration: '20s', target: 15 },  // 15 VUs
    { duration: '20s', target: 30 },  // 30 VUs
    { duration: '20s', target: 50 },  // 50 VUs (limite de concorrência para escrita + bcrypt)
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1500'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  // Gera e-mail único por VU e iteração para não colidir na constraint UQ_e_mail
  const unico = `${__VU}_${__ITER}_${Date.now()}`;
  const payload = JSON.stringify({
    acao: 'cadastro',
    nome: `Treinador_${__VU}_${__ITER}`,
    email: `sla_${unico}@joquemmon.com`,
    senha: 'Teste@1234',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post('http://localhost/joquemmon-api/auth.php', payload, params);

  check(res, {
    'status é 201': (r) => r.status === 201,
  });

  sleep(0.3);
}