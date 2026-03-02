class CifradoCesar {
    static cifrar(texto, desplazamiento) {
        const alfabeto = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';

        return this.quitarTildes(texto)
            .toUpperCase()
            .split('')
            .map(char => this.cifrarCaracter(char, desplazamiento, alfabeto))
            .join('');
    }

    static descifrar(texto, desplazamiento) {
        return this.cifrar(texto, -desplazamiento);
    }

    static cifrarCaracter(char, desplazamiento, alfabeto) {
        const indice = alfabeto.indexOf(char);

        if (indice !== -1) {
            const nuevoIndice = (indice + desplazamiento + alfabeto.length) % alfabeto.length;
            return alfabeto[nuevoIndice];
        } else {
            return char;
        }
    }

    static quitarTildes(texto) {
        return texto.replace(/[áéíóúÁÉÍÓÚ]/g, match => 'aeiouAEIOU'['áéíóúÁÉÍÓÚ'.indexOf(match)]);
    }
}

// Ejemplo de uso
// const textoOriginal = 'A partir de ahora solo dare instrucciones cifradaslas reuniones seran falsas';
// const desplazamiento = 1;

// const textoCifrado = CifradoCesar.cifrar(textoOriginal, desplazamiento);
// console.log('Texto cifrado:', textoCifrado);

// const textoDescifrado = CifradoCesar.descifrar(textoCifrado, desplazamiento);
// console.log('Texto descifrado:', textoDescifrado);

class CF {
    constructor() {
      this.abecedario = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
    }
  
    cifrar(texto, desplazamiento, aleatorio) {
      texto = this.quitarTildes(texto.toUpperCase());
      let resultado = '';
  
      for (let i = 0; i < texto.length; i++) {
        let caracter = texto[i];
  
        if (this.abecedario.includes(caracter)) {
          let indice = (this.abecedario.indexOf(caracter) + desplazamiento) % this.abecedario.length;
          
          // Manejar índices negativos
          indice = indice < 0 ? this.abecedario.length + indice : indice;
  
          resultado += this.abecedario[indice];
  
          // Agregar letras aleatorias
          for (let j = 0; j < aleatorio; j++) {
            let letraAleatoria = this.abecedario[Math.floor(Math.random() * this.abecedario.length)];
            resultado += letraAleatoria;
          }
        } else {
          resultado += caracter;
        }
      }
  
      return resultado;
    }
  
    descifrar(textoCifrado, desplazamiento, aleatorio) {
      let resultado = '';
  
      for (let i = 0; i < textoCifrado.length; i++) {
        let caracter = textoCifrado[i];
  
        if (this.abecedario.includes(caracter)) {
          let indice = (this.abecedario.indexOf(caracter) - desplazamiento) % this.abecedario.length;
  
          // Manejar índices negativos
          indice = indice < 0 ? this.abecedario.length + indice : indice;
  
          resultado += this.abecedario[indice];
  
          // Saltar letras aleatorias
          i += aleatorio;
        } else {
          resultado += caracter;
        }
      }
  
      return resultado;
    }
  
    quitarTildes(texto) {
      return texto.replace(/[áéíóúÁÉÍÓÚ]/g, match => 'aeiouAEIOU'['áéíóúÁÉÍÓÚ'.indexOf(match)]);
    }
  }
  
  // Ejemplo de uso
  const cf = new CF();
  
  const textoOriginal = "HOLA, ¿CÓMO ESTÁS? roñoso";
  const textoCifrado = cf.cifrar(textoOriginal, -10, 0);
  const textoDescifrado = cf.descifrar(textoCifrado, -10, 0);
  
  console.log("Texto original:", textoOriginal);
  console.log("Texto cifrado:", textoCifrado);
  console.log("Texto descifrado:", textoDescifrado);