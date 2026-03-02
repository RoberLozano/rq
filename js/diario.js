var links = []
    var fechas = []
    var buscarFecha = false;
    cargar()

    function foo() {
      var selObj = window.getSelection();
      alert(selObj);
      var selRange = selObj.getRangeAt(0);
      console.log(selRange);
      // do stuff with the range
    }

    function fo() {
      var el = document.getElementById('texto')
      var s = window.getSelection().toString();
      const [start, end] = [el.selectionStart, el.selectionEnd];
      el.setRangeText(`<h2 id='${s}'>${s}</h2>`, start, end, 'select');
    }

    function buscar(b) {
      buscarFecha = b;
      console.log(buscarFecha);
    }

function all() {
  cargar()
  let t =
        document.getElementById('texto').value;

        document.getElementById('diario').innerHTML=buscarEnlaces(t);
        //cargar de nuevo
        cargar()
        document.getElementById('diario').innerHTML=buscarEnlaces(t);
  
}

    function buscarEnlaces(t, div='entrada') {


      fechas.forEach((l) => {
        console.log('Busco '+l);
        //cualquier fecha que no acabe en salto de linea
        var replace = `(${l})([^\n"<])`;
        var re = new RegExp(replace, "g");
        let clases=  t.matchAll(re);
        //console.log(clases)
        let arr=[...clases]
        console.log(arr);

        t = t.replace(re,
          `<a href="#$1">$1</a>$2`)
      })

      links.forEach((l) => {
        console.log('Busco '+l);
        //titulos que no tengan " ni <
        var replace = `(${l})([^"<])`;
        console.log(replace);
        var re = new RegExp(replace, "g");
        // let clases=  t.matchAll(re);
        //console.log(clases)
        // let arr=[...clases]
        // console.log(arr);
        t = t.replace(re,
          `<a href="#$1">$1</a>$2`)
      })

      console.log(t);
      document.getElementById(div).innerHTML+=t;
      let x=t;
      return x;
      
    }

    function cargar(hx = 'h2') {
      let h = document.getElementsByTagName(hx)
      //console.log(h);
      links = []
      for (l in h) {
        let n = (h[l].innerText);
        if (n) {
          if (n.match(/(\d{1,2}-\d{1,2}-\d{3,4})/))
            fechas.push(n)
          else
            links.push(n)
          console.log(n);
        }
      }
      // document.getElementById('entrada').innerHTML = links
    }

function clases(){
  let t =
        document.getElementById('texto').value
      let clases=  t.matchAll(/class ([\p{L}]+) extends ([\p{L}]+)/gu);
      //console.log(clases)
      let arr=[...clases]
      let s='var Clases = {}\n'
      arr.forEach((x,i)=> {
        //   s+=`${x[2]}['${x[1]}']=${x[1]}\n`
          s+=`Clases['${x[1]}']=${x[1]}\n`
          // console.log(x[1],x[2])
        console.log(
          `${x[2]}['${x[1]}']=${x[1]};\n`)
      })
      console.log(s)
}
    var fecha

    function formatear(arg) {
      // body...
      let t =
        document.getElementById('texto').value
      // links.forEach((l) => t = t.replace(l+'([^\n])',
      //   `<a href="#${l}">${l}</a>$2`
      // ))


      // fechas.forEach((l) => {
      //   var replace = `(${l})([^\n])`;
      //   var re = new RegExp(replace, "g");
      //   t = t.replace(re,
      //     `<a href="#$1">$1</a>$2`)
      //   // `<a href="#${l}">${l}</a>`)

      // })

      if (buscarFecha) {
        t = formatearFecha(t);

        document.getElementById('diario').innerHTML=+ t
        cargar()
        buscarEnlaces(t);
        document.getElementById('diario').innerHTML+= buscarEnlaces(t);
      }
      else {

        let f =
          document.getElementById('fecha').value
        fecha = new Date(f);
        var sfecha = fecha.getDate() + '/' +
          (fecha.getMonth() + 1) + '/' + fecha.getFullYear()
        console.log(sfecha);
        //   document.getElementById('entrada').innerHTML=`<h2 id='${f}'>${f}</h2>`+t
        // console.log(f);
        document.getElementById('diario').innerHTML += `<h2 id='${sfecha}' >${sfecha}</h2>` + t
      }


    }

    function formatearFecha(s) {
      let t = s;
      //hace referencia en todas las fechas
      t = t.replace(/(\d{1,2}-\d{1,2}-\d{3,4})([^\n])/g,
        `<a href="#$1">$1</a>$2`);
        
      t = t.replace(/(\d{1,2}-\d{1,2}-\d{3,4})\n/g,
        `<h2 id='$1'>$1</h2>`);
      return t;
    }

    function formatearPersonaje(s = document.getElementById('texto').value) {
      let t = s;
      console.log(t.match(/\n([\p{L}\s]+)\n/gu));
      t = t.replace(/\n([\p{L}\s]+)\n/gu,
        `<h2 id='$1'>$1</h2>`);
      document.getElementById('Personajes').innerHTML = t
      cargar();
      t=buscarEnlaces(document.getElementById('Personajes').innerHTML);
      return t;
    }


    console.log(formatearFecha('11-11-777\n11-13-777\n14-11-777'));