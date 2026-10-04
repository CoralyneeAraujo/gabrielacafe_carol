// ==========================================================================
//  CONTEÚDO PESSOAL — edite este arquivo com a história real de vocês.
//  Tudo que está entre [colchetes] é para trocar. Não precisa mexer no resto do código.
// ==========================================================================

export type Fala = { quem: 'ela' | 'voce' | 'narrador'; texto: string };

export const PERSONAL = {
  nomeDela: 'Gabriela',          // nome da sua namorada
  seuNome: 'Carol',              // seu nome (assina a carta e aparece nas suas falas)
  nomeRestaurante: "Gabi's Restaurant",
  juntasDesde: '',               // ex.: '12/06/2023' — aparece em "Nossa história"

  // Frases que as clientes (você) falam ao receber o pedido
  frasesClientes: [
    'Hmm, do jeitinho que eu gosto!',
    'Você cozinha com amor, né?',
    'Melhor restaurante da cidade ♥',
    'Volto amanhã só pra te ver.',
    'Isso aqui tem gosto de domingo com você.',
    'Posso pedir a cozinheira também?',
    'A comida tá ótima, mas a cozinheira tá melhor ainda.',
    'Vou deixar 5 estrelas… pra cozinheira.',
    'Tem como levar a chef pra viagem?',
    'Comi tudo! Agora quero sobremesa: você.',
    'Esse restaurante é perigoso, viu? Já tô apaixonada.',
    'Se eu vier todo dia, ganho desconto ou um beijo?',
    'Que delícia… o hambúrguer também.',
    'Parabéns ao chef. Tá linda hoje, hein?',
    'Mais gostoso que Burger King. Não conta pra ninguém.',
    'Vou ficar mais um pouquinho só pra te olhar.',
  ],
  // Quando a cliente senta e faz o pedido
  frasesEsperando: [
    'Oi, moça bonita do avental ♥',
    'Vim pela comida. Mentira, vim te ver.',
    'O de sempre, por favor… e o seu número.',
    'Capricha que hoje eu tô com fome!',
    'Cheguei! Sentiu saudade?',
    'Qual o prato do dia? E a cozinheira tá no cardápio?',
  ],
  // Quando a paciência dela está acabando
  frasesImpaciente: [
    'Amor… tô com fome!',
    'Ei! Esqueceu de mim?',
    'Vou começar a reclamar no Google, hein!',
    'Tô esperando, mas só porque é você.',
    'Hmpf. Ainda bem que você é bonita.',
  ],

  // Memórias (os "bilhetes"). Cada uma abre quando o nível sobe; nível = um dos 15 de Nossa história.
  memorias: [
    { nivel: 2, titulo: 'O começo', falas: [
      { quem: 'narrador', texto: 'Às vezes, as melhores histórias começam sem a gente perceber.' },
      { quem: 'voce', texto: 'Na primeira vez que a vi, eu ainda não sabia o quanto ela seria importante. Só sabia que havia algo nela que me fazia querer ficar por perto.' },
      { quem: 'ela', texto: 'Você vai votar em quem?' },
    ] },
    { nivel: 8, titulo: 'Quando eu soube', falas: [
      { quem: 'narrador', texto: 'Talvez a gente perceba que está apaixonada quando, sem perceber, ela começa a aparecer em todos os pensamentos e a vontade de estar perto nunca parece suficiente.' },
      { quem: 'voce', texto: 'O que eu senti? Que estava completamente ferrada. Nunca imaginei que pudesse me apaixonar tão rápido, querer tanto alguém por perto e me tornar tão melosa sem nem perceber.' },
    ] },
    { nivel: 9, titulo: 'Nosso pedido de namoro', falas: [
      { quem: 'narrador', texto: 'Depois de construir toda uma história dentro de um jogo, pensei que seria especial fazer o pedido por lá também. O jogo era uma brincadeira, mas o pedido tinha 100% de verdade: eu queria levar aquilo que a gente tinha construído para a vida real.' },
      { quem: 'voce', texto: 'Eu sei que foi "sim". Agora, sendo bem sincera, não lembro muito bem de como aconteceu… aparentemente ela também me pediu em namoro outro dia, na praia. Só sei que, de algum jeito, a situação foi engraçada e no final nós duas saímos namorando.' },
    ] },
    { nivel: 12, titulo: 'Nosso momento', falas: [
      { quem: 'narrador', texto: 'A gente vive assistindo filmes, jogando alguma coisa ou simplesmente conversando sobre tudo e, ao mesmo tempo, sobre absolutamente nada. E acho que é justamente isso que eu mais gosto: poder estar com ela, mesmo quando não estamos fazendo nada de especial.' },
      { quem: 'voce', texto: 'No fim, tudo se torna especial simplesmente por eu estar com ela.' },
    ] },
    { nivel: 14, titulo: 'Mesa reservada', noite: true, falas: [
      { quem: 'narrador', texto: 'Campos do Jordão. Uma mesa só pra nós duas, velas acesas e um pianista tocando baixinho.' },
      { quem: 'voce', texto: 'A gente pediu fondue e ficou ali a noite toda, rindo e conversando, como se o resto do mundo tivesse sumido.' },
      { quem: 'ela', texto: 'Foi a noite mais romântica de todas.' },
    ] },
  ] as { nivel: number; titulo: string; noite?: boolean; falas: Fala[] }[],

  // O Pedido Especial: o combo do primeiro encontro (Burger King do shopping).
  // Opções: cafe, batata, hamburguer, xburger, suco, panquecas, xsalada, milkshake
  pedidoEspecial: {
    titulo: 'O nosso primeiro encontro',
    receitas: ['xburger', 'batata', 'suco'],
  },

  // Cena depois de entregar o Pedido Especial
  cenaEspecial: [
    { quem: 'voce', texto: 'Você lembra desse pedido?' },
    { quem: 'ela', texto: 'Hambúrguer, batata e bebida… isso é Burger King!' },
    { quem: 'voce', texto: 'Foi o que a gente comeu no nosso primeiro encontro, no Burger King do shopping.' },
    { quem: 'voce', texto: 'E virou o nosso ritual: até hoje, sempre que dá, é lá que a gente vai comer juntas.' },
    { quem: 'voce', texto: 'Eu queria te dizer uma coisa…' },
  ] as Fala[],

  // Carta final (aparece depois do coração). Pode ter várias linhas.
  cartaFinal: `No fim, não importa quantas histórias a gente invente, quantos jogos a gente jogue ou quantos lugares ainda vamos conhecer. Se eu pudesse escolher de novo, escolheria encontrar você em todas elas.

Obrigada por transformar os momentos mais simples em memórias que eu quero guardar para sempre.

Essa história começou em um jogo, mas o que eu sinto por você sempre foi de verdade. E, depois de tudo que já vivemos, eu ainda escolheria você para todas as próximas histórias que a vida quiser nos contar.`,
};
