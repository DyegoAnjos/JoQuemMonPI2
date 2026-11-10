import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '15s', target: 10 },  // Aquecimento: 10 usuários simultâneos
    { duration: '20s', target: 30 },  // Carga moderada: 30 VUs
    { duration: '20s', target: 60 },  // Carga alta: 60 VUs
    { duration: '20s', target: 100 }, // Estresse / limite de concorrência: 100 VUs
    { duration: '10s', target: 0 },   // Ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // SLA alvo: 95% abaixo de 500ms
    http_req_failed: ['rate<0.05'],   // Menos de 5% de falha
  },
};

export default function () {
  const res = http.get('http://localhost/joquemmon-api/cartas.php?usuario_id=1');

  check(res, {
    'status é 200': (r) => r.status === 200,
  });

  sleep(0.2);
}