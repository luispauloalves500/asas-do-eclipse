export interface Bullet{id:number;active:boolean;x:number;y:number;px:number;py:number;vx:number;vy:number;r:number;damage:number;friendly:boolean;clearable:boolean;source:string;life:number}
export class BulletPool{
 items:Bullet[]=Array.from({length:600},(_,i)=>({id:10000+i,active:false,x:0,y:0,px:0,py:0,vx:0,vy:0,r:.15,damage:10,friendly:false,clearable:true,source:'',life:0}));
 spawn(x:number,y:number,vx:number,vy:number,friendly:boolean,damage:number,source:string,clearable=true){const b=this.items.find(b=>!b.active);if(!b)throw new Error('Orçamento de projéteis excedido');Object.assign(b,{active:true,x,y,px:x,py:y,vx,vy,r:friendly?.09:.19,friendly,damage,source,clearable,life:8});return b;}
 clear(hostileOnly=false){for(const b of this.items)if(!hostileOnly||!b.friendly&&b.clearable)b.active=false;}
}
