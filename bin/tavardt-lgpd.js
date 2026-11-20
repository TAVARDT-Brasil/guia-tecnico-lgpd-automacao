#!/usr/bin/env node

/**
 * TAVARDT Brasil | CLI de Auditoria Rápida de Perímetro e LGPD
 * https://tools.tavardt.com/br/
 */

const https = require('https');
const dns = require('dns').promises;

const target = process.argv[2];

if (!target) {
  console.log('Uso: node bin/tavardt-lgpd.js <dominio-ou-url>');
  console.log('Exemplo: node bin/tavardt-lgpd.js empresa.com.br\n');
  process.exit(1);
}

const cleanDomain = target.replace(/^https?:\/\//i, '').replace(/\/.*$/, '');
const fullUrl = `https://${cleanDomain}`;

console.log('================================================================');
console.log(' TAVARDT Brasil | Auditoria Técnica Perimetral & Conformidade');
console.log(` Alvo: ${cleanDomain}`);
console.log('================================================================\n');

async function runAudit() {
  // 1. Verificação de Cabeçalhos HTTP
  console.log('[1/3] Inspecionando cabeçalhos de segurança HTTP...');
  try {
    const res = await new Promise((resolve, reject) => {
      const req = https.get(fullUrl, { timeout: 8000 }, resolve);
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout de conexão')); });
    });

    const headers = res.headers;
    const checks = [
      { name: 'Strict-Transport-Security (HSTS)', present: !!headers['strict-transport-security'] },
      { name: 'Content-Security-Policy (CSP)', present: !!headers['content-security-policy'] },
      { name: 'X-Frame-Options (Anti-Clickjacking)', present: !!headers['x-frame-options'] },
      { name: 'X-Content-Type-Options (nosniff)', present: !!headers['x-content-type-options'] },
      { name: 'Referrer-Policy', present: !!headers['referrer-policy'] }
    ];

    checks.forEach(c => {
      console.log(`  ${c.present ? '[OK]' : '[AVISO]'} ${c.name}: ${c.present ? 'Ativo' : 'Ausente'}`);
    });
  } catch (err) {
    console.log(`  [ERRO] Falha ao conectar em ${fullUrl}: ${err.message}`);
  }

  // 2. Verificação de Registro DMARC
  console.log('\n[2/3] Verificando registro DMARC no DNS...');
  try {
    const records = await dns.resolveTxt(`_dmarc.${cleanDomain}`);
    const dmarcRecord = records.flat().find(r => r.startsWith('v=DMARC1'));
    if (dmarcRecord) {
      console.log(`  [OK] Registro DMARC encontrado: ${dmarcRecord}`);
    } else {
      console.log('  [ALERTA CRÍTICO] Registro DMARC ausente! Domínio vulnerável a spoofing e falsificação.');
    }
  } catch {
    console.log('  [ALERTA CRÍTICO] Registro DMARC ausente ou erro de consulta DNS.');
  }

  // 3. Verificação de Exposição de Arquivo .env
  console.log('\n[3/3] Testando se o arquivo /.env está exposto...');
  try {
    const envRes = await new Promise((resolve, reject) => {
      const req = https.get(`${fullUrl}/.env`, { timeout: 6000 }, resolve);
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });

    if (envRes.statusCode === 200) {
      console.log('  [VULNERABILIDADE CRÍTICA] O arquivo /.env retornou HTTP 200! Suas credenciais podem estar expostas.');
    } else {
      console.log(`  [OK] Arquivo /.env protegido (HTTP ${envRes.statusCode}).`);
    }
  } catch {
    console.log('  [OK] Arquivo /.env não acessível diretamente.');
  }

  console.log('\n================================================================');
  console.log(' DIAGNÓSTICO COMPLETO DISPONÍVEL ONLINE:');
  console.log(` https://tools.tavardt.com/br/verificador-dmarc-email/`);
  console.log(` https://tools.tavardt.com/br/validador-consent-mode-v2-lgpd/`);
  console.log(' Para remediação corporativa: https://ag.tavardt.com/br/ciberseguranca/');
  console.log('================================================================\n');
}

runAudit();
