# Descriptive statistics with explicit sample-statistic conventions.
statlab_mode <- function(x) {
  x <- x[!is.na(x)]
  if (length(x) == 0L) return(x)
  counts <- table(x)
  names(counts)[counts == max(counts)]
}

statlab_descriptive_summary <- function(x, na.rm = TRUE) {
  stopifnot(is.numeric(x))
  values <- if (na.rm) x[!is.na(x)] else x
  if (length(values) == 0L) stop("At least one non-missing numeric value is required.")
  q <- quantile(values, c(0, .25, .5, .75, 1), names = FALSE, na.rm = na.rm)
  c(count = length(values), mean = mean(values, na.rm = na.rm), median = median(values, na.rm = na.rm),
    variance_sample = var(values, na.rm = na.rm), sd_sample = sd(values, na.rm = na.rm),
    min = q[[1]], q1 = q[[2]], q3 = q[[4]], max = q[[5]], iqr = IQR(values, na.rm = na.rm),
    range = diff(range(values, na.rm = na.rm)))
}

statlab_correlation <- function(x, y, method = "pearson") {
  stopifnot(is.numeric(x), is.numeric(y), length(x) == length(y), length(x) > 1L)
  cor(x, y, use = "complete.obs", method = method)
}
