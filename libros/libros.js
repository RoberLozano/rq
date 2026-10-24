  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyBp6yKtqKG7WaSQzVqu0pcWJz1NmpGPo2I",
    authDomain: "libros-rls777.firebaseapp.com",
    databaseURL: "https://libros-rls777.firebaseio.com",
    projectId: "libros-rls777",
    storageBucket: "libros-rls777.appspot.com",
    messagingSenderId: "635145019747",
    appId: "1:635145019747:web:bccd91ac191b6662c3b356",
    measurementId: "G-PDMJ645KC1"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  var database = firebase.database();
  
class Libro {
        constructor(isbn,titulo,autor,paginas,fecha,rating) {
			this.isbn = isbn
			this.titulo = titulo
			this.autor = autor
			this.paginas = paginas
			this.fecha = fecha
			this.rating = rating
    }

    guardar(){
        if (this.isbn) {
            var ref = database.ref("/libros/").child(this.isbn)
            ref.set(this)
            console.log(this);
        }
    }

    
}