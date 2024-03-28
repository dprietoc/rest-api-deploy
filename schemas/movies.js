const z = require('zod')

const movieSchema = z.object({
  title: z.string({
    invalid_type_error: 'Title must be a string',
    required_error: 'Title is required',
  }),
  year: z.number().int().min(1900).max(2025),
  director: z.string(),
  duration: z.number().int().positive(),
  poster: z.string().url({
    message: 'Poster must be a valid URL',
  }),
  genre: z.array(z.enum([
    'Action', 'Adventure', 'Animation', 'Biography', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi',
    {
      required_error: 'Genre is required',
      invalid_type_error: 'Movie genre must be an array of enum Genre',
    }
  ])),
  rate: z.number().min(0).max(10).default(5) // using .default() it means rate is optional
});

// Function param is called 'input' as long as it is not validated as a movie resourse
function validateMovie (input){
  // .safeParse() returns an resolve object with { data, error, success }
  // There is also a .safeParseAsync() that returns a promise
  return movieSchema.safeParse(input)
}

function validatePartialMovie (input) {
  // .partial() force the object to have optional properties
  return movieSchema.partial().safeParse(input)
}

module.exports = {
  validateMovie,
  validatePartialMovie
};