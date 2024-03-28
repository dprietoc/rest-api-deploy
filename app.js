/**
 * REST (Representational State Transfer)
 * Es una Arquitectura de Software para comunicacion de sistemas en la web
 * API RESTful son un tipo de implementacion que utiliza URLs para ident RECURSOS, metodos HTTP para especificar operaciones
 * y representa datos en formato JSON o XML
 * 
 * Principios:
 * 1. Escalabilidad, 2. Portabilidad, 3. Simplicidad, 4. Visibilidad, 5. Fiabilidad, 5. Accesibilidad
 * 
 * Fundamentos:
 * 1. RECURSO > TODO es cosiderado un recurso (usuarios, libros, autos, etc). Cada RECURSO se identifica con UNA URL
 * 2. VERBOS (o metodos) para definir las OPERACIONES realizables con los RECURSOS: GET, POST, PUT, PATCH, DELETE, OPTIONS
 * 3. REPRESENTACIONES o formatos (JSON, XML, HTML, etc) que deberian ser definidos por el usuario
 * 4. STATELESS > el servidor no debe mantener ningún estado del cliente entre solicitudes (no puede guardar cant de llamadas,
 *    si tiene que paginar, etc) Esa info debe ir en la petición para que el server sepa cómo responder
 * 5. INTERFAZ UNIFORME (consistencia)> las URLs siempre tienen que hacer lo mismo, se tienen que llamar igual (dificil de cumplir siempre)
 * 6. SEPARACION DE CONCEPTOS > permite que el cliente y servidor evolucionen de forma separada (no monolito)
 *  
*/
const crypto = require('node:crypto')
const express = require('express')

let movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const PORT = process.env.PORT ?? 1234;

const ACCEPTED_ORIGINS = [
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://david-movies.com'
];

const app = express();
// Quita el header X-Powered-By: Express (publicidad)
app.disable('x-powered-by'); 
// Middleware para parsear req con Content-type json (parsea el body)
app.use(express.json()) 

// Root
app.get('/', (req, res) => {
  // Diferentes REPRESENTACIONES segun request
  const format = req.query.format;
  if (format === 'html') {
    res.send('<h1>Hola mundo HTML!</h1>')
  }
  res.json({ message: "hola mundo" });
});

// Todos los recursos que sean MOVIES se identifican con /movies 
app.get('/movies', (req, res) => {
  // Todos los dominios: '*'
  // res.header('Access-Control-Allow-Origin', '*');
  // res.header('Access-Control-Allow-Origin', 'http://127.0.0.1:5500');
  // No Origin: cuando la req es del mismo ORIGIN
  // http://localhost:1234/index.html -> http://localhost:1234/api/movies (mismo origin)
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  const {genre} = req.query;
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()))
    if (!filteredMovies.length) {
      return res.status(404).json({ message: `Movies by ${genre} not found.`})
    }
    return res.json(filteredMovies)
  } 
  res.json(movies)
})

app.get('/movies/:id', (req, res) => { //lib > path-to-regexp
  const {id} = req.params;
  const movie = movies.find((movie) => movie.id === id);
  if (movie) {
    return res.json(movie);
  }
  res.status(404).json({message: `Movie ${id} not found.`})
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const {id} = req.params;
  // Con el Index puedo saber si existe y dsp me sirve para actualzar el recurso
  const movieIndex = movies.findIndex(movie => movie.id === id);

  if (movieIndex === -1) {
    return res.status(404).json({ message: `Movie ${id} not found.` })
  }

  const updatedMovie = {
    ...movies[movieIndex],
    ...result.data
  }

  movies[movieIndex] = updatedMovie;

  res.json(updatedMovie)
})

// SIEMPRE TIENE QUE SER EL MISMO RECURSO
app.post('/movies', (req, res) => {
  // Aca se valida con algo que se ejecute en RUNTIME como ZOD
  // NOTA: TS no es suficiente porque se ejecuta en tiempo de compilacion
  const result = validateMovie(req.body);

  if (result.error) {
    // 422 Unprocessable Content || 400 Bad Request
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // Esto se modificara en BD
  const newMovie = {
    id: crypto.randomUUID(), // uuid v4 (v8 lo tiene nativo para Browser)
    ...result.data // ❌ req.body (no validado)
  }
  // Esto no es REST por guardar el estado en memoria (se reemplaza por BD)
  movies.push(newMovie);
  return res.status(201).json(newMovie) // actualizar la cache del cliente
})

// Este POST ES CON VALIDACIONES MANUALES (NO RECOMENDABLES)
// app.post('/movies', (req, res) => {
//   const { 
//     title,
//     year,
//     director,
//     duration,
//     poster,
//     rate,
//     genre
//   } = req.body;  // gracias al -> app.use(express.json())

//   // Este tipo de validaciones son muy costosas de hacer (serian infinitas validaciones)
//   // if (!title || !year || !director || !duration || !genre) {
//   //   return res.statusCode(400).json({ message: 'Missing required fields' })
//   // }
//   // ...

//   const newMovie = {
//     id: crypto.randomUUID(), // uuid v4 (v8 lo tiene nativo para Browser)
//     title,
//     year,
//     director,
//     duration,
//     poster,
//     rate: rate ?? 0,
//     genre
//   }
//   // Esto no es REST por guardar el estado en memoria (se reemplaza por BD)
//   movies.push(newMovie);
//   return res.status(201).json(newMovie) // actualizar la cache del cliente
// })

app.delete('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  const {id} = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);
  if (movieIndex === -1) {
    return res.status(404).json({ message: `Movie ${id} not found.`});
  }

  movies.splice(movieIndex, 1);
  res.json({ message: `Movie deleted ${id}`})
})

app.options('/movies/:id', (req, res) => {
  const origin = req.header('origin')
  if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  }
  res.sendStatus(200)
})

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
})
