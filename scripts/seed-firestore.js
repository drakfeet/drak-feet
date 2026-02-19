#!/usr/bin/env node
/*
 * Seed Firestore (CLI)
 * Uso:
 * node scripts/seed-firestore.js --serviceAccount ./serviceAccountKey.json [--projectId drak-feet-admin] [--overwrite]
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { overwrite: false };
  for (let i = 2; i < argv.length; i += 1) {
    const part = argv[i];
    if (part === '--overwrite') {
      args.overwrite = true;
      continue;
    }
    if (part.startsWith('--serviceAccount=')) {
      args.serviceAccount = part.split('=')[1];
      continue;
    }
    if (part === '--serviceAccount') {
      args.serviceAccount = argv[i + 1];
      i += 1;
      continue;
    }
    if (part.startsWith('--projectId=')) {
      args.projectId = part.split('=')[1];
      continue;
    }
    if (part === '--projectId') {
      args.projectId = argv[i + 1];
      i += 1;
      continue;
    }
  }
  return args;
}

function getTiposPadrao() {
  return [
    { id: 'padrao', nome: 'Padrao', nomePropriedade: 'Variacao', opcoesTamanho: ['Unico', 'P', 'M', 'G'], ativo: true },
    { id: 'numeracao', nome: 'Numeracao', nomePropriedade: 'Numeracao', opcoesTamanho: Array.from({ length: 10 }, (_, i) => String(i + 1)), ativo: true },
    { id: 'voltagem', nome: 'Voltagem', nomePropriedade: 'Voltagem', opcoesTamanho: ['110V', '220V', 'Bivolt'], ativo: true },
    { id: 'capacidade', nome: 'Capacidade', nomePropriedade: 'Capacidade', opcoesTamanho: ['250ml', '500ml', '1L'], ativo: true },
    { id: 'calcado', nome: 'Calcado', nomePropriedade: 'Numeracao', opcoesTamanho: Array.from({ length: 12 }, (_, i) => String(34 + i)), ativo: true },
    { id: 'modelo', nome: 'Camisa', nomePropriedade: 'Tamanho', opcoesTamanho: ['P', 'M', 'G', 'GG', 'XG'], ativo: true },
    { id: 'calca', nome: 'Calca', nomePropriedade: 'Numeracao', opcoesTamanho: Array.from({ length: 11 }, (_, i) => String(38 + i)), ativo: true },
    { id: 'bermuda', nome: 'Bermuda', nomePropriedade: 'Tamanho', opcoesTamanho: ['P', 'M', 'G', 'GG'], ativo: true }
  ];
}

async function main() {
  const args = parseArgs(process.argv);

  if (!args.serviceAccount) {
    console.error('Informe --serviceAccount ./serviceAccountKey.json');
    process.exit(1);
  }

  const serviceAccountPath = path.resolve(process.cwd(), args.serviceAccount);
  if (!fs.existsSync(serviceAccountPath)) {
    console.error(`Arquivo não encontrado: ${serviceAccountPath}`);
    process.exit(1);
  }

  let admin;
  try {
    admin = require('firebase-admin');
  } catch (e) {
    console.error('Dependência ausente: firebase-admin');
    console.error('Execute: npm install');
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: args.projectId || serviceAccount.project_id
  });

  const db = admin.firestore();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const overwrite = !!args.overwrite;

  const summary = {
    config: 0,
    tipos_produto: 0,
    categorias: 0,
    marcas: 0,
    banners: 0,
    menu_links: 0,
    redes_sociais: 0,
    paginas: 0,
    cupons: 0
  };

  async function shouldWrite(collection, docId) {
    if (overwrite) return true;
    const doc = await db.collection(collection).doc(docId).get();
    return !doc.exists;
  }

  if (await shouldWrite('config', 'loja')) {
    await db.collection('config').doc('loja').set({
      nomeLoja: 'Minha Loja',
      whatsapp: '5511999999999',
      mensagemPadrao: 'Olá! Gostaria de fazer um pedido: {produto}',
      mensagemCarrinho: 'Olá! Gostaria de finalizar meu pedido:\n\n{produtos}\n\nResumo: {quantidade} item(ns) | Pagamento: {pagamento}\nSubtotal: R$ {subtotal} | Desconto: R$ {desconto}\nCupom: {cupom}\nEntrega: {entrega} | Frete: R$ {frete}\nTotal: R$ {total}',
      mensagemCarrinhoItem: '{numero}. *{produto}* - {marca}\n   Tamanho: {tamanho} | Pagamento: {pagamento}\n   Qtd: {quantidade} | Valor unit.: R$ {valor} | Subtotal: R$ {subtotal}',
      footerTexto: 'Sua loja de confiança com os melhores produtos e preços.',
      atualizadoEm: now
    }, { merge: true });
    summary.config += 1;
  }

  for (const tipo of getTiposPadrao()) {
    if (!(await shouldWrite('tipos_produto', tipo.id))) continue;
    const { id, ...data } = tipo;
    await db.collection('tipos_produto').doc(id).set({
      ...data,
      criadoEm: now,
      atualizadoEm: now
    }, { merge: true });
    summary.tipos_produto += 1;
  }

  if (await shouldWrite('categorias', 'geral')) {
    await db.collection('categorias').doc('geral').set({
      nome: 'Geral',
      slug: 'geral',
      ordem: 0,
      ativo: true,
      criadoEm: now,
      atualizadoEm: now
    }, { merge: true });
    summary.categorias += 1;
  }

  if (await shouldWrite('marcas', 'drak-feet')) {
    await db.collection('marcas').doc('drak-feet').set({
      nome: 'Drak Feet',
      slug: 'drak-feet',
      logoUrl: '',
      descricao: '',
      ativo: true,
      criadoEm: now,
      atualizadoEm: now
    }, { merge: true });
    summary.marcas += 1;
  }

  if (await shouldWrite('banners', 'banner-principal')) {
    await db.collection('banners').doc('banner-principal').set({
      titulo: 'Banner principal',
      texto: 'Edite este banner no painel',
      imagemUrl: '',
      linkUrl: '',
      ordem: 1,
      tipo: 'slider',
      ativo: false,
      criadoEm: now,
      atualizadoEm: now
    }, { merge: true });
    summary.banners += 1;
  }

  if (await shouldWrite('menu_links', 'inicio')) {
    await db.collection('menu_links').doc('inicio').set({
      texto: 'Início',
      url: '#inicio',
      icone: '',
      ordem: 1,
      abrirNovaAba: false,
      destacado: false,
      ativo: true,
      criadoEm: now,
      atualizadoEm: now
    }, { merge: true });
    summary.menu_links += 1;
  }

  if (await shouldWrite('redes_sociais', 'whatsapp')) {
    await db.collection('redes_sociais').doc('whatsapp').set({
      tipo: 'whatsapp',
      nome: 'WhatsApp',
      icone: '💬',
      url: 'https://wa.me/5511999999999',
      ordem: 1,
      ativo: true,
      criadoEm: now,
      atualizadoEm: now
    }, { merge: true });
    summary.redes_sociais += 1;
  }

  if (await shouldWrite('paginas', 'sobre')) {
    await db.collection('paginas').doc('sobre').set({
      titulo: 'Sobre',
      slug: 'sobre',
      modoConteudo: 'texto',
      conteudoTexto: 'Edite esta página no painel administrativo.',
      conteudoHtml: '',
      conteudoBlocos: [],
      ativo: false,
      criadoEm: now,
      atualizadoEm: now
    }, { merge: true });
    summary.paginas += 1;
  }

  if (await shouldWrite('cupons', 'primeira10')) {
    await db.collection('cupons').doc('primeira10').set({
      codigo: 'PRIMEIRA10',
      tipo: 'primeira_compra',
      valor: 10,
      ativo: false,
      validadeInicio: '',
      validadeFim: '',
      limiteUso: 0,
      limitePorCliente: 1,
      subtotalMinimo: 0,
      descontoMaximo: 0,
      regras: {
        entregaPermitida: [],
        pagamentosPermitidos: [],
        categorias: [],
        marcas: [],
        produtoIds: []
      },
      criadoEm: now,
      atualizadoEm: now
    }, { merge: true });
    summary.cupons += 1;
  }

  console.log('Seed concluído com sucesso.');
  console.table(summary);

  await admin.app().delete();
}

main().catch((error) => {
  console.error('Falha no seed:', error);
  process.exit(1);
});
