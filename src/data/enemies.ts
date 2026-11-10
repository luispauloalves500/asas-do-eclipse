export const enemies={
 E01:{name:'Vespa NÓX',hp:25,r:.62,speed:2.4,score:100,warning:.45,recover:2.4,damage:15},
 E02:{name:'Mosquito',hp:35,r:.65,speed:2.0,score:200,warning:.45,recover:2.7,damage:18},
 E05:{name:'Bastilha',hp:80,r:.9,speed:1.15,score:250,warning:.7,recover:2.8,damage:22},
 E06:{name:'Olho Vermelho',hp:70,r:.78,speed:1.05,score:200,warning:1.2,recover:3.1,damage:32}
} as const;
export type EnemyKind=keyof typeof enemies;
