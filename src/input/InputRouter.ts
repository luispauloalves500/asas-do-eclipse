export interface Commands{x:number;y:number;special:boolean;bomb:boolean}
export class InputRouter {
 keys=new Set<string>();special=false;bomb=false;pointer:{id:number;x:number;y:number}|null=null;dragX=0;dragY=0; padButtons:boolean[]=[];
 constructor(private stage:HTMLElement,private pause:()=>void){
 window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Shift','Escape'].includes(e.key))e.preventDefault();if(!e.repeat){if(['Escape','p','P'].includes(e.key))this.pause();if(e.key==='Shift')this.special=true;if(e.key.toLowerCase()==='e')this.bomb=true;}this.keys.add(e.key.toLowerCase());});
 window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>this.clear());
 stage.addEventListener('pointerdown',e=>{if(e.button===2){e.preventDefault();this.special=true;return;}this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY};stage.setPointerCapture(e.pointerId);});
 stage.addEventListener('pointermove',e=>{if(!this.pointer||this.pointer.id!==e.pointerId)return;const scale=28/stage.clientHeight;this.dragX+=(e.clientX-this.pointer.x)*scale;this.dragY-=(e.clientY-this.pointer.y)*scale;this.pointer.x=e.clientX;this.pointer.y=e.clientY;});
 const end=()=>{this.pointer=null;this.dragX=this.dragY=0;};stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);stage.addEventListener('contextmenu',e=>e.preventDefault());
 }
 clear(){this.keys.clear();this.special=this.bomb=false;this.pointer=null;this.dragX=this.dragY=0;}
 sample(dt:number,speed:number):Commands{const k=this.keys;let x=Number(k.has('d')||k.has('arrowright'))-Number(k.has('a')||k.has('arrowleft')),y=Number(k.has('w')||k.has('arrowup'))-Number(k.has('s')||k.has('arrowdown'));const pad=navigator.getGamepads?.()[0];if(pad){const dead=(v:number)=>Math.abs(v)<.14?0:(Math.abs(v)-.14)/.86*Math.sign(v);x+=dead(pad.axes[0]||0)+(pad.buttons[15]?.pressed?1:0)-(pad.buttons[14]?.pressed?1:0);y-=dead(pad.axes[1]||0);y+=(pad.buttons[12]?.pressed?1:0)-(pad.buttons[13]?.pressed?1:0);for(const [i,action] of [[0,'special'],[1,'bomb'],[9,'pause']] as const){if(pad.buttons[i]?.pressed&&!this.padButtons[i]){if(action==='pause')this.pause();else this[action]=true;}this.padButtons[i]=!!pad.buttons[i]?.pressed;}}
 x+=this.dragX/(speed*dt);y+=this.dragY/(speed*dt);this.dragX=this.dragY=0;const len=Math.hypot(x,y);if(len>1){x/=len;y/=len;}const result={x,y,special:this.special,bomb:this.bomb};this.special=this.bomb=false;return result;}
}
