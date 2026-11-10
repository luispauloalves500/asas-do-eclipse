export function rescueProgress(progress:number,inside:boolean,dt:number){return Math.max(0,Math.min(1,progress+(inside?dt/1.5:-dt/3)));}
