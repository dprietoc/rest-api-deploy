const crypto = require('node:crypto')
const express = require('express')
const cors = require('cors')

let movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const PORT = process.env.PORT ?? 1234;

const ACCEPTED_ORIGINS = [
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://david-movies.com'
];

var corsOptions = {
  origin(origin, callback) {
    if (ACCEPTED_ORIGINS.includes(origin) || !origin){
      return callback(null, true)
    }
    callback(new Error('Not allowed by CORS'))
  }
}

const app = express();
app.disable('x-powered-by'); 
app.use(express.json()) 
// middlawe para solucionar cors pero con origin * default
// caso contrario usar corsOptions
app.use(cors(corsOptions)) 

// Endoints
app.get('/', (req, res) => {
  res.json({ message: "hola mundo" });
});

app.get('/movies', (req, res) => {
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

app.get('/movies/:id', (req, res) => {
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
  const movieIndex = movies.findIndex(movie => movie.id === id);
  if (movieIndex === -1) {
    return res.status(404).json({ message: `Movie ${id} not found.` })
  }
  // Esto se modificara en BD
  const updatedMovie = {
    ...movies[movieIndex],
    ...result.data
  }
  movies[movieIndex] = updatedMovie;
  res.json(updatedMovie)
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body);
  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }
  // Esto se modificara en BD
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data
  }
  movies.push(newMovie);
  return res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  const {id} = req.params;
  const movieIndex = movies.findIndex((movie) => movie.id === id);
  if (movieIndex === -1) {
    return res.status(404).json({ message: `Movie ${id} not found.`});
  }
  // Esto se modificara en BD
  movies.splice(movieIndex, 1);
  res.json({ message: `Movie deleted ${id}`})
})

app.listen(PORT, () => {
  console.log(`Server listening on port http://localhost:${PORT}`);
})
