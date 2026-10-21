# Return chart-ready data computed in R; the browser renders it with Recharts.
statlab_histogram_data <- function(x, breaks = "Sturges") {
  stopifnot(is.numeric(x), length(x) > 0L)
  h <- hist(x, breaks = breaks, plot = FALSE)
  data.frame(left = head(h$breaks, -1L), right = tail(h$breaks, -1L), count = h$counts,
    density = h$density, midpoint = h$mids)
}

statlab_boxplot_data <- function(x) {
  stopifnot(is.numeric(x), length(x) > 0L)
  unname(boxplot.stats(x)$stats)
}
