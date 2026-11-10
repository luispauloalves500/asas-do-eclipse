import mission from '../data/stages/M01.json';
import {enemies,type EnemyKind} from '../data/enemies';
import {BulletPool} from './EntityPool';
import {SpatialHash,overlaps,segmentDistance,type Circle} from './Collision2D';
import {rescueProgress} from './RescueSystem';
import type {Commands} from '../input/InputRouter';
import type {Save} from '../persistence/SaveStore';
export interface Enemy extends Circle{kind:EnemyKind;px:number;py:number;hp:number;age:number;originX:number;state:string;timer:number;aimX:number;aimY:number;active:boolean}
export interface Pickup {id:number;x:number;y:number;px:number;py:number;kind:'scrap'|'repair';life:number;value:number;active:boolean}
export interface Rescue {id:number;x:number;y:number;px:number;py:number;progress:number;active:boolean;age:number;rescued:boolean}
export interface Fx{id:number;x:number;y:number;age:number;life:number;size:number;color:string}
export interface Laser {id:number;x:number;y:number;tx:number;ty:number;width:number;age:number;warn:number;duration:number;source:string;owner:number;active:boolean;lock:number}
export interface Boss {x:number;y:number;py:number;hp:number;left:number;right:number;phase:number;invul:number;age:number;cycle:number;dead:boolean;deathTime:number}
export interface Target extends Circle{type:'enemy'|'core'|'left'|'right';enemy?:Enemy}
export class World {
 time=0;scroll=0;state:'playing'|'dying'|'victory'|'defeat'='playing';deathTime=0;id=1;seed=1627;waveIndex=0;rescueIndex=0;repairSpawned=false;
 player={id:0,x:0,y:-9,px:0,py:-9,vx:0,vy:0,r:.33,hp:100,maxHp:100,invul:0,fire:0,bombs:2,specials:2,beam:0};
 speed:number;damage:number;magnet:number;pool=new BulletPool();enemies:Enemy[]=[];pickups:Pickup[]=[];rescues:Rescue[]=[];lasers:Laser[]=[];fx:Fx[]=[];boss:Boss|null=null;
 targets=new SpatialHash<Target>();hostiles=new SpatialHash<import('./EntityPool').Bullet>();events:string[]=[];score=0;combo=1;comboTimer=0;maxCombo=1;scrap=0;rescued=0;kills=0;spawned=0;shots=0;hits=0;damageTaken=0;parts=0;lastDamage='';message='';messageTime=0;damageLog:{time:number;source:string;entityId:number}[]=[];
 constructor(save:Save,public debug=false){this.speed=8.2*(1+.03*save.upgrades.motor);this.damage=10*(1+.1*save.upgrades.canhao);this.magnet=1.575+.35*save.upgrades.ima;this.say('Lina: Arkan ainda tem gente no solo. Não vamos abandonar ninguém.',8);}
 random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 say(text:string,seconds=2){this.message=text;this.messageTime=seconds;}
 effect(x:number,y:number,size=1,color='#ffc075'){this.fx.push({id:this.id++,x,y,age:0,life:.55,size,color});if(this.fx.length>90)this.fx.shift();}
 productive(points:number){this.score+=Math.round(points*this.combo);this.combo=Math.min(5,this.combo+.2);this.maxCombo=Math.max(this.maxCombo,this.combo);this.comboTimer=4;}
 spawnEnemy(kind:EnemyKind,x:number,y=16){const d=enemies[kind];this.enemies.push({id:this.id++,kind,x,y,px:x,py:y,r:d.r,hp:d.hp,age:0,originX:x,state:'SPAWN',timer:.6,aimX:0,aimY:-12,active:true});this.spawned++;}
 spawnPickup(kind:'scrap'|'repair',x:number,y:number,value=10){this.pickups.push({id:this.id++,x,y,px:x,py:y,kind,life:14,value,active:true});}
 startBoss(){this.enemies=[];this.pool.clear(true);this.lasers=[];this.boss={x:0,y:18,py:18,hp:600,left:200,right:200,phase:1,invul:1.5,age:0,cycle:1,dead:false,deathTime:0};this.say('NÓX • GÁRGULA-01 — desarme os canhões laterais.',5);this.events.push('laser');}
 jumpBoss(){this.time=340;this.waveIndex=mission.waves.length;this.rescueIndex=3;this.repairSpawned=true;this.startBoss();}
 tick(dt:number,c:Commands){
 if(this.state==='victory'||this.state==='defeat')return;
 if(this.state==='dying'){this.deathTime+=dt;this.animate(dt*.18);if(this.deathTime>=.55)this.state='defeat';return;}
 if(this.boss?.dead){this.boss.deathTime+=dt;this.animate(dt);if(Math.floor(this.boss.deathTime*7)>Math.floor((this.boss.deathTime-dt)*7))this.effect((this.random()-.5)*6,8+(this.random()-.5)*3,1.7);if(this.boss.deathTime>=3.5)this.state='victory';return;}
 this.time+=dt;this.scroll+=mission.scrollSpeed*dt;this.animate(dt);this.messageTime=Math.max(0,this.messageTime-dt);
 this.comboTimer-=dt;if(this.comboTimer<=0)this.combo=Math.max(1,this.combo-dt*.5);
 this.director();this.movePlayer(dt,c);this.updateEnemies(dt);this.updateBoss(dt);this.updateProjectiles(dt);this.updateLasers(dt);this.updatePickups(dt);this.updateRescues(dt);
 }
 animate(dt:number){for(const f of this.fx)f.age+=dt;this.fx=this.fx.filter(f=>f.age<f.life);}
 director(){
 while(this.waveIndex<mission.waves.length&&this.time>=mission.waves[this.waveIndex].atSeconds){const w=mission.waves[this.waveIndex++];for(let i=0;i<w.count;i++){const x=w.count===1?-4:(i-(w.count-1)/2)*(w.enemy==='E05'||w.enemy==='E06'?8:2.3);this.spawnEnemy(w.enemy as EnemyKind,x,16+Math.abs(i-(w.count-1)/2)*1.2);}}
 while(this.rescueIndex<mission.rescues.length&&this.time>=mission.rescues[this.rescueIndex].atSeconds){const r=mission.rescues[this.rescueIndex++];this.rescues.push({id:this.id++,x:r.laneX,y:10,px:r.laneX,py:10,progress:0,active:true,age:0,rescued:false});this.say('SIGNAL CIVIL • aproxime-se e mantenha 1,5 s no círculo.',5);}
 if(!this.repairSpawned&&this.time>=mission.repairAtSeconds){this.repairSpawned=true;this.spawnPickup('repair',2,11,25);this.say('Kit de reparo à direita • +25 de integridade.',4);}
 if(!this.boss&&this.time>=mission.bossEntryAtSeconds)this.startBoss();
 if(this.time>6&&this.time<6.04)this.say('WASD / SETAS • mova-se. O disparo é automático.',6);
 if(this.time>19&&this.time<19.04)this.say('SHIFT • Raio Lança    E • Bomba de Pulso. Duas cargas de cada.',7);
 if(this.time>35&&this.time<35.04)this.say('Contato hostil à frente. O ponto ciano é sua hitbox.',5);
 }
 movePlayer(dt:number,c:Commands){const p=this.player;p.px=p.x;p.py=p.y;p.invul=Math.max(0,p.invul-dt);p.beam=Math.max(0,p.beam-dt);
 const approach=(v:number,target:number,a:number)=>v+Math.max(-a,Math.min(a,target-v));p.vx=approach(p.vx,c.x*this.speed,(c.x?35:40)*dt);p.vy=approach(p.vy,c.y*this.speed,(c.y?35:40)*dt);p.x=Math.max(-7.2+p.r,Math.min(7.2-p.r,p.x+p.vx*dt));p.y=Math.max(-12+p.r,Math.min(7-p.r,p.y+p.vy*dt));
 p.fire-=dt;if(p.fire<=0){p.fire+=1/6;this.pool.spawn(p.x,p.y+1,0,25,true,this.damage,'Canhão Aurora');this.shots++;this.events.push('shot');}
 if(c.special&&p.specials>0){p.specials--;p.beam=1.2;this.events.push('laser');this.say('RAIO LANÇA • perfuração ativa');}
 if(c.bomb&&p.bombs>0){p.bombs--;this.pool.clear(true);for(const e of this.enemies)if(e.active&&Math.hypot(e.x-p.x,e.y-p.y)<14)this.hitEnemy(e,100);if(this.boss&&Math.hypot(this.boss.x-p.x,this.boss.y-p.y)<24){this.hitBoss('left',80);this.hitBoss('right',80);this.hitBoss('core',80);}this.effect(p.x,p.y,8,'#7cf3ff');this.events.push('bomb');this.say('BOMBA DE PULSO • projéteis eliminados');}
 }
 updateEnemies(dt:number){for(const e of this.enemies){if(!e.active)continue;const d=enemies[e.kind];e.px=e.x;e.py=e.y;e.age+=dt;e.y-=d.speed*dt;if(e.kind==='E02')e.x=e.originX+Math.sin(e.age*1.7)*1.3;
 e.timer-=dt;
 if(e.y>12){e.state='FORMATION';continue;}
 if(e.state==='SPAWN'||e.state==='FORMATION'){e.state='ACQUIRE_TARGET';e.timer=.15;}
 if(e.timer<=0){switch(e.state){case 'ACQUIRE_TARGET':case 'RECOVER':e.state='TELEGRAPH';e.timer=d.warning;e.aimX=this.player.x;e.aimY=this.player.y;if(e.kind==='E06'){this.addLaser(e.x,e.y,e.aimX,e.aimY,.48,1.2,.8,d.name,e.id);this.events.push('laser');}break;
 case 'TELEGRAPH':e.state='ATTACK';e.timer=e.kind==='E06'?.8:.12;if(e.kind!=='E06')this.enemyFire(e);break;
 case 'ATTACK':e.state='RECOVER';e.timer=d.recover;break;}}
 if(e.y<-17){e.active=false;e.state='RETREAT';}else if(overlaps(e,this.player))this.hurt(20,d.name+' (contato)',e.id);
 }
 this.enemies=this.enemies.filter(e=>e.active);
 }
 enemyFire(e:Enemy){const d=enemies[e.kind];if(e.kind==='E01'){this.pool.spawn(e.x,e.y-.7,0,-8,false,d.damage,d.name);}else if(e.kind==='E02'){for(const dx of [-.55,.55])this.pool.spawn(e.x+dx,e.y-.4,dx*.6,-7,false,d.damage,d.name);}else{const dx=e.aimX-e.x,dy=e.aimY-e.y,len=Math.hypot(dx,dy)||1;for(const side of [-.45,.45])this.pool.spawn(e.x+side,e.y,dx/len*8,dy/len*8,false,d.damage,d.name);}}
 addLaser(x:number,y:number,tx:number,ty:number,width:number,warn:number,duration:number,source:string,owner:number){const dx=tx-x,dy=ty-y,len=Math.hypot(dx,dy)||1;this.lasers.push({id:this.id++,x,y,tx:x+dx/len*40,ty:y+dy/len*40,width,age:0,warn,duration,source,owner,active:true,lock:0});}
 updateBoss(dt:number){const b=this.boss;if(!b||b.dead)return;b.py=b.y;b.age+=dt;b.y=Math.max(8.5,b.y-2.8*dt);b.invul=Math.max(0,b.invul-dt);if(b.y>8.5)return;
 if(b.invul>0)return;b.cycle-=dt;
 if(b.phase===1&&b.cycle<=.45&&b.cycle+dt>.45)this.addLaser(b.x,b.y-1,b.x,-15,.02,.45,0,'Aviso Gárgula',-1);
 if(b.cycle<=0){if(b.phase===1){for(const angle of [-.3,0,.3])this.pool.spawn(b.x,b.y-1,Math.sin(angle)*7,-Math.cos(angle)*7,false,20,'Gárgula • leque');b.cycle=2.2;}
 else if(b.phase===2){for(const [x,hp,owner] of [[-2.6,b.left,-2],[2.6,b.right,-3]])if(hp>0)this.addLaser(x,b.y-1,x,-15,.65,.9,.75,'Gárgula • rail AA',owner);for(const a of [-.28,.28])this.pool.spawn(0,b.y-1,Math.sin(a)*7,-Math.cos(a)*7,false,22,'Gárgula • leque');b.cycle=b.left&&b.right?3.2:4.2;this.events.push('laser');}
 else{this.addLaser(0,b.y-1,0,-15,1.15,1.2,1,'Gárgula • laser central',-1);for(const [x,hp] of [[-2.6,b.left],[2.6,b.right]])if(hp>0)for(const a of [-.2,.2])this.pool.spawn(x,b.y-1,Math.sin(a)*7,-Math.cos(a)*7,false,22,'Gárgula • canhão lateral');b.cycle=4.2;this.events.push('laser');}}
 if(overlaps({id:-1,x:b.x,y:b.y,r:1.45},this.player))this.hurt(35,'Gárgula (casco)',-1);
 }
 updateLasers(dt:number){for(const l of this.lasers){l.age+=dt;if(l.owner>0&&!this.enemies.some(e=>e.id===l.owner&&e.active))l.active=false;if(l.owner===-2&&(this.boss?.left||0)<=0)l.active=false;if(l.owner===-3&&(this.boss?.right||0)<=0)l.active=false;
 if(l.age>=l.warn+.15&&l.age<=l.warn+.15+l.duration&&l.active&&segmentDistance(this.player.x,this.player.y,l.x,l.y,l.tx,l.ty)<this.player.r+l.width/2)this.hurt(l.owner>0?32:38,l.source,l.owner);
 if(l.age>l.warn+.15+l.duration)l.active=false;}
 this.lasers=this.lasers.filter(l=>l.active);
 }
 buildTargets(){this.targets.clear();for(const e of this.enemies)if(e.active)this.targets.insert({id:e.id,x:e.x,y:e.y,r:e.r,type:'enemy',enemy:e});const b=this.boss;if(b&&!b.dead){if(b.left>0)this.targets.insert({id:-2,x:-2.6,y:b.y-.4,r:1,type:'left'});if(b.right>0)this.targets.insert({id:-3,x:2.6,y:b.y-.4,r:1,type:'right'});this.targets.insert({id:-1,x:0,y:b.y,r:1.4,type:'core'});}}
 updateProjectiles(dt:number){this.buildTargets();this.hostiles.clear();for(const b of this.pool.items){if(!b.active)continue;b.px=b.x;b.py=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(b.life<=0||b.y>19||b.y<-18||Math.abs(b.x)>13){b.active=false;continue;}
 if(b.friendly){for(const t of this.targets.query(b)){if(overlaps(b,t)){b.active=false;this.hits++;if(t.enemy)this.hitEnemy(t.enemy,b.damage);else this.hitBoss(t.type as 'left'|'right'|'core',b.damage);break;}}}else this.hostiles.insert(b);}
 for(const b of this.hostiles.query(this.player))if(b.active&&overlaps(b,this.player)){b.active=false;this.hurt(b.damage,b.source,b.id);}
 if(this.player.beam>0){for(const e of this.enemies)if(e.active&&e.y>this.player.y&&Math.abs(e.x-this.player.x)<e.r+.45)this.hitEnemy(e,150*dt);const boss=this.boss;if(boss&&!boss.dead){for(const [kind,x] of [['left',-2.6],['right',2.6],['core',0]] as const)if(Math.abs(x-this.player.x)<(kind==='core'?1.4:1)+.45)this.hitBoss(kind,150*dt);}}
 }
 hitEnemy(e:Enemy,damage:number){if(!e.active)return;e.hp-=damage;if(e.hp<=0){e.active=false;e.state='DEATH';this.kills++;this.productive(enemies[e.kind].score);this.effect(e.x,e.y,e.kind==='E05'?1.5:1);this.events.push('explosion');this.spawnPickup('scrap',e.x,e.y,e.kind==='E05'||e.kind==='E06'?20:10);} }
 hitBoss(part:'left'|'right'|'core',damage:number){const b=this.boss;if(!b||b.dead||b.invul>0||b[part==='core'?'hp':part]<=0)return;const key=part==='core'?'hp':part;b[key]=Math.max(0,b[key]-damage);
 if(part!=='core'&&b[key]<=0){this.parts++;this.productive(600);this.effect(part==='left'?-2.6:2.6,b.y,2);this.events.push('explosion');this.say('CANHÃO DESTRUÍDO • padrão lateral desativado');}
 if(b.hp<=0){b.dead=true;this.player.invul=999;this.pool.clear();this.lasers=[];this.enemies=[];this.productive(10000);this.splashCollect();this.events.push('win');this.say('CORREDOR LIBERADO • Arkan está livre!',5);return;}
 const phase=b.hp<=180?3:b.hp<=390?2:1;if(phase!==b.phase){b.phase=phase;b.invul=.9;b.cycle=1.5;this.pool.clear(true);this.lasers=[];this.say(`GÁRGULA-01 • FASE ${phase} — blindagem em transição (0,9 s)`,2);this.events.push('laser');}
 }
 splashCollect(){for(const p of this.pickups)if(p.active&&p.kind==='scrap'){this.scrap+=p.value;p.active=false;}}
 hurt(damage:number,source:string,id:number){const p=this.player;if(p.invul>0||this.state!=='playing'||this.boss?.dead)return;p.hp=Math.max(0,p.hp-damage);p.invul=.85;this.damageTaken+=damage;this.combo=1;this.lastDamage=source;this.damageLog.push({time:this.time,source,entityId:id});this.events.push('hit');this.effect(p.x,p.y,.7,'#7cf3ff');if(p.hp<=0){this.state='dying';this.effect(p.x,p.y,2.5);this.events.push('explosion');}}
 updatePickups(dt:number){for(const p of this.pickups){if(!p.active)continue;p.px=p.x;p.py=p.y;p.life-=dt;p.y-=.7*dt;const dx=this.player.x-p.x,dy=this.player.y-p.y,d=Math.hypot(dx,dy);if(d<this.magnet+(p.kind==='repair'?.25:0)){const speed=Math.min(11,2+d*5);p.x+=dx/(d||1)*Math.min(speed*dt,d);p.y+=dy/(d||1)*Math.min(speed*dt,d);}if(d<.5){p.active=false;if(p.kind==='scrap')this.scrap+=p.value;else this.player.hp=Math.min(100,this.player.hp+25);this.events.push('pickup');}if(p.life<=0||p.y<-16)p.active=false;}this.pickups=this.pickups.filter(p=>p.active);}
 updateRescues(dt:number){for(const r of this.rescues){if(!r.active)continue;r.px=r.x;r.py=r.y;r.age+=dt;r.y-=.72*dt;r.progress=rescueProgress(r.progress,Math.hypot(this.player.x-r.x,this.player.y-r.y)<=1.5,dt);if(r.progress>=1){r.active=false;r.rescued=true;this.rescued++;this.productive(500);this.scrap+=30;this.effect(r.x,r.y,1.8,'#7cf3ff');this.events.push('rescue');this.say('RESGATE CONCLUÍDO • +30 sucatas');}if(r.y<-14||r.age>34){r.active=false;this.say('Sinal perdido. A missão continua.');}}}
 get elimination(){return this.spawned?this.kills/this.spawned:0;}
 get accuracy(){return this.shots?Math.min(1,this.hits/this.shots):0;}
 get segment(){return this.boss?'CONFRONTO • GÁRGULA-01':this.time<40?'APROXIMAÇÃO • ARKAN':this.time<120?'CONTATO • ESQUADRÃO NÓX':this.time<210?'OPERAÇÃO • RESGATE DE SINAL':'DEFESA • TORRES ANTIAÉREAS';}
}
