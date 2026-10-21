# Introductory control-flow and function examples.
statlab_grade <- function(score) {
  if (length(score) != 1L || is.na(score) || score < 0 || score > 100)
    stop("score must be one number from 0 to 100")
  if (score >= 90) "A" else if (score >= 75) "B" else if (score >= 60) "C" else "Needs practice"
}

statlab_sum_loop <- function(values) {
  total <- 0
  for (value in values) total <- total + value
  total
}

statlab_squares <- function(values) {
  values ^ 2
}
