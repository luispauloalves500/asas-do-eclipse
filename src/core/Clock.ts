export const FIXED_DT=1/60;
export class Clock {
  accumulator=0;
  reset(){this.accumulator=0;}
  advance(delta:number,paused:boolean,tick:(dt:number)=>void){
    if(paused)return this.accumulator/FIXED_DT;
    this.accumulator=Math.min(.1,this.accumulator+Math.max(0,Math.min(delta,.1)));
    while(this.accumulator+1e-10>=FIXED_DT){tick(FIXED_DT);this.accumulator-=FIXED_DT;}
    return Math.max(0,this.accumulator/FIXED_DT);
  }
}
