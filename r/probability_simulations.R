# Reproducible sampling helpers; set seed explicitly when repeatability is needed.
statlab_simulate_dice <- function(n = 1000L, seed = NULL) {
  stopifnot(length(n) == 1L, n >= 1L, n <= 1000000L)
  if (!is.null(seed)) set.seed(seed)
  sample.int(6L, size = as.integer(n), replace = TRUE)
}

statlab_coin_experiment <- function(n = 1000L, probability = .5, seed = NULL) {
  stopifnot(n >= 1L, probability >= 0, probability <= 1)
  if (!is.null(seed)) set.seed(seed)
  rbinom(as.integer(n), size = 1L, prob = probability)
}

statlab_binomial_experiment <- function(n = 1000L, trials = 10L, probability = .5, seed = NULL) {
  stopifnot(n >= 1L, trials >= 0L, probability >= 0, probability <= 1)
  if (!is.null(seed)) set.seed(seed)
  rbinom(as.integer(n), size = as.integer(trials), prob = probability)
}

statlab_normal_sample <- function(n = 1000L, mean = 0, sd = 1, seed = NULL) {
  stopifnot(n >= 1L, sd > 0)
  if (!is.null(seed)) set.seed(seed)
  rnorm(as.integer(n), mean = mean, sd = sd)
}
