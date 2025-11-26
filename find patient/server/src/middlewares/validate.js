export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query)
    if (error) {
      error.status = 400
      return next(error)
    }
    req.query = value
    next()
  }
}
