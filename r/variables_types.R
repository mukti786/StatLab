# StatLab R fundamentals: type inspection and safe coercion examples.
statlab_inspect <- function(x) {
  list(value = x, typeof = typeof(x), class = class(x), length = length(x), missing = anyNA(x))
}

statlab_convert <- function(x, target = c("numeric", "character", "logical", "integer")) {
  target <- match.arg(target)
  switch(target,
    numeric = as.numeric(x), character = as.character(x),
    logical = as.logical(x), integer = as.integer(x))
}
