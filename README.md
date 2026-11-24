# Guia Técnico de Adequação LGPD & Automação de Segurança

[![Licença MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TAVARDT Tools](https://img.shields.io/badge/TAVARDT-Diagnostic%20Suite-5b3cf5.svg)](https://tools.tavardt.com/br/)
[![Conformidade LGPD](https://img.shields.io/badge/LGPD-Lei%2013.709%2F2018-00C853.svg)](https://ag.tavardt.com/br/ciberseguranca/)

Guia prático e ferramental técnico de adequação à **Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)** para desenvolvedores, arquitetos de software, administradores de sistemas e gestores de segurança da informação no Brasil.

Desenvolvido e mantido pela equipe de engenharia da **TAVARDT**.

***

## 1. Visão Geral e Princípios Técnicos da LGPD

A conformidade com a LGPD vai além de termos jurídicos: ela exige salvaguardas arquiteturais estritas no código, nas APIs e na infraestrutura de servidores (Art. 46):

> *"Os agentes de tratamento devem adotar medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas."*

### Os 4 Pilares Técnicos de Auditoria:
1. **Consentimento Explícito e Google Consent Mode v2:** Coleta de telemetria apenas após consentimento ativo do titular.
2. **Criptografia e Segurança em Trânsito:** TLS 1.3, HSTS rígido e cabeçalhos de proteção HTTP.
3. **Prevenção contra Exposição de Credenciais:** Bloqueio de arquivos `.env`, backups e repositórios `.git` na raiz pública.
4. **Proteção de Identidade e Antifraude (DMARC/SPF/DKIM):** Garantia de que terceiros não emitam comunicações falsas em nome do seu domínio.

***

## 2. Ferramentas Gratuitas de Diagnóstico TAVARDT

Antes de iniciar correções manuais, audite seu ambiente em tempo real utilizando a suíte de diagnósticos abertos da TAVARDT:

* [Validador de Consent Mode v2 e LGPD](https://tools.tavardt.com/br/validador-consent-mode-v2-lgpd/): Analisa os sinais `ad_storage`, `analytics_storage`, `ad_user_data` e `ad_personalization`.
* [Verificador de DMARC & Autenticação de E-mails](https://tools.tavardt.com/br/verificador-dmarc-email/): Valida políticas SPF/DKIM para evitar fraudes corporativas.
* [Scanner de Arquivos Expostos (.env, git)](https://tools.tavardt.com/br/verificador-arquivos-expostos/): Testa se variáveis de ambiente confidenciais estão acessíveis publicamente.
* [Análise de Cabeçalhos de Segurança HTTP](https://tools.tavardt.com/br/analise-cabecalhos-seguranca/): Verifica CSP, HSTS, X-Frame-Options e Referrer-Policy.
* [Auditor de Conformidade de Cookies e Metadados](https://tools.tavardt.com/br/verificador-meta-tags/): Inspeciona tags abertas e vazamento de identificadores de sessão.

***

## 3. Implementação Prática: Google Consent Mode v2 (LGPD Compliant)

Para plataformas que utilizam Google Analytics 4 ou Google Ads, o Consent Mode v2 é mandatório. Abaixo está o padrão canónico de inicialização com estado padrão negado (*denied*):

```html
<!- Google Consent Mode v2 - Padrão TAVARDT LGPD ->
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}

  // Define padrão negado antes do carregamento de qualquer script de tracking
  gtag('consent', 'default', {
    'ad_storage': 'denied',
    'analytics_storage': 'denied',
    'ad_user_data': 'denied',
    'ad_personalization': 'denied',
    'wait_for_update': 500
  });
  gtag('set', 'ads_data_redaction', true);
  gtag('set', 'url_passthrough', false);
</script>

<!- Carregamento do Google Tag Manager ->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>
```

### Atualização pós-consentimento do usuário:
Quando o titular aceita os cookies de estatística e marketing no banner:

```javascript
function aceitarCookies(analiticos, marketing) {
  gtag('consent', 'update', {
    'analytics_storage': analiticos ? 'granted' : 'denied',
    'ad_storage': marketing ? 'granted' : 'denied',
    'ad_user_data': marketing ? 'granted' : 'denied',
    'ad_personalization': marketing ? 'granted' : 'denied'
  });
  localStorage.setItem('tavardt_lgpd_consent', JSON.stringify({ analiticos, marketing, date: new Date().toISOString() }));
}
```

***

## 4. CLI de Auditoria Rápida de Perímetro

Este repositório inclui uma ferramenta CLI em Node.js para validação imediata de segurança perimetral via terminal.

### Execução Direta via NPX / Node:
```bash
node bin/tavardt-lgpd.js seudominio.com.br
```

### O que a CLI verifica:
1. Resposta HTTPS com certificado válido.
2. Cabeçalhos HTTP obrigatórios (HSTS, Content-Security-Policy, X-Frame-Options).
3. Detecção de exposição crítica do arquivo `/.env`.
4. Existência de registro DNS DMARC (`_dmarc.seudominio.com.br`).

***

## 5. Checklist de Boas Práticas para Equipes de DevOps

- [ ] **Anonimização de IP:** Configurar `anonymize_ip: true` em qualquer script de coleta.
- [ ] **Hardening de Cabeçalhos:** Garantir que o servidor web emita `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
- [ ] **Bloqueio de Varreduras:** Proteger diretórios sensíveis (`/admin`, `/backup`, `/.git`) contra indexação e acesso direto no arquivo `robots.txt` e no servidor web.
- [ ] **Criptografia de Banco de Dados:** Aplicar criptografia AES-256 em colunas contendo CPF, telefone, e-mail e dados financeiros.
- [ ] **Logs de Acesso:** Manter trilha de auditoria imutável de acessos administrativos por no mínimo 6 meses (Marco Civil da Internet, Art. 15).

***

## 6. Consultoria Corporativa & Auditoria de Cibersegurança

Necessita de apoio especializado para conduzir adequação completa, pentests ou resposta a incidentes de vazamento?

* **Portal Corporativo:** [Portal Institucional](https://ag.tavardt.com/br/)
* **Serviços de Cibersegurança:** https://ag.tavardt.com/br/ciberseguranca/
* **Diagnóstico Completo de Domínio:** Central de Ferramentas
* **Contato Técnico Direto:** [https://ag.tavardt.com/br/contato/](https://ag.tavardt.com/br/contato/)

***

## Licença

Distribuído sob a licença MIT. Consulte `LICENSE` para mais detalhes.  
Copyright

***

© 2026 TAVARDT. Todos os direitos reservados.
