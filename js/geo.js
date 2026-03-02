class Punto {
    constructor(x,y,id=null,radio=1,titulo=false) {
        this.x = x
        this.y = y
        this.id= id
        this.radio = radio
        this.color = "black"
        this.titulo=titulo
}

    coor(p){
        if(!p) return {x:this.x, y:this.y}
        else
        this.x=p.x;
        this.y=p.y;
    }


    dist(p2){
        return (Math.hypot(p2.x-this.x, p2.y-this.y));
    }

    svg(){
        let id= this.id? `id="${this.id}"`:"";
        let ti= this.titulo? `<title>${this.titulo}</title>`:"";
        return `<circle fill=${this.color} stroke="#000000" stroke-width="0" cx=${this.x} cy=${this.y} r=${this.radio} ${id} >${ti}</circle>`;

    }
}

function bbCoor(bb) {
    let x,y;
    x=bb.x +(bb.width/2)
    y=bb.y +(bb.height/2)
    return {x:x,y:y};
    
    
}



class Path {
        constructor(...puntos) {
            if(!puntos)
            this.puntos=[];
            else
            this.puntos = puntos
            
            this.color="black";
            this.sw="0.01"//stroke-width="2"
        }

    nombrar(id){
        this.id=id;
    }

    add(punto){
        // let d=0.003;
        // let last=this.puntos[this.puntos.length - 1]
        // if(Math.abs(last.x-punto.x)<d || Math.abs(last.y-punto.y)<d) return;
        this.puntos.push(punto);
    }

    svg(){
        // console.log(this.puntos);
        // if(this.puntos.length<2) return;
        var d="";
        this.puntos.forEach((p ,i)=> {
            // console.log(p,i);
            if(i==0) d+= `M ${p.x} ${p.y} `
            else{
                d+= `L ${p.x} ${p.y} `
            }
            
        });

        // d+= `M ${this.puntos[0].x} ${this.puntos[0].y} `
        // //IF Q
        // for (var index = 1; index < this.puntos.length-1; index++) {
        //     let p= this.puntos[index];
        //     let p2 = this.puntos[index+1];
        //     d+= `Q ${p.x} ${p.y} ${p2.x+10} ${p2.y-30} `
        // }
        

        
        let id= this.id? `id="${this.id}"`:"";
        // console.log(`<path ${id} d="${d}" stroke="${this.color}"  fill="transparent" stroke-width="${this.sw}" />`);
        return `<path ${id} d="${d}" stroke="${this.color}"  fill="transparent" stroke-width="${this.sw}" />`
    }
}

class Estancia {
        constructor(lugar,inicio,fin) {
			this.lugar = lugar
			this.inicio = inicio
			this.fin = fin
    }

    ok(fecha,lugar=false){
        return (fecha>=this.inicio&&fecha<=this.fin)
            
    }
}

const e1 = new Estancia("casa","2020-07-01","2020-07-07" );

console.log("2020-07-05", e1.ok("2020-07-05"));
console.log("2020-07-01", e1.ok("2020-07-01"));
console.log("2020-07-07", e1.ok("2020-07-07"));
console.log("2020-07-08", e1.ok("2020-07-08"));
console.log("2020-07-10", e1.ok("2020-07-10"));
console.log("2020-06-08", e1.ok("2020-06-08"));
