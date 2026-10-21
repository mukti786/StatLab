# Small reusable vector and matrix operations used in StatLab lessons.
statlab_vector_summary <- function(x) {
  stopifnot(is.atomic(x), length(x) > 0L)
  c(length = length(x), sum = sum(x, na.rm = TRUE), mean = mean(x, na.rm = TRUE),
    min = min(x, na.rm = TRUE), max = max(x, na.rm = TRUE))
}

statlab_matrix_summary <- function(x) {
  stopifnot(is.matrix(x), is.numeric(x))
  list(dimensions = dim(x), row_sums = rowSums(x), column_sums = colSums(x), transpose = t(x))
}

statlab_recycle_add <- function(x, y) {
  if (length(x) == 0L || length(y) == 0L) stop("Inputs must not be empty.")
  if (max(length(x), length(y)) %% min(length(x), length(y)) != 0L)
    warning("Longer object length is not a multiple of shorter object length.")
  x + y
}
