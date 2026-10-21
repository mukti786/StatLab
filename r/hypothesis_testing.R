# Introductory one-sample test wrapper; returns the genuine R test result.
statlab_one_sample_test <- function(x, mu = 0, alternative = "two.sided", conf.level = .95) {
  stopifnot(is.numeric(x), length(x) >= 2L)
  t.test(x, mu = mu, alternative = alternative, conf.level = conf.level)
}

statlab_proportion_test <- function(successes, trials, probability = .5) {
  stopifnot(trials > 0L, successes >= 0L, successes <= trials)
  binom.test(successes, trials, p = probability)
}
