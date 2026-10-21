# Data-frame helpers for the interactive dataset lessons.
statlab_filter_rows <- function(data, column, threshold) {
  stopifnot(is.data.frame(data), column %in% names(data))
  data[!is.na(data[[column]]) & data[[column]] >= threshold, , drop = FALSE]
}

statlab_summarise_numeric <- function(data) {
  stopifnot(is.data.frame(data))
  numeric_data <- data[vapply(data, is.numeric, logical(1))]
  if (ncol(numeric_data) == 0L) return(data.frame())
  do.call(rbind, lapply(names(numeric_data), function(name) {
    x <- numeric_data[[name]]
    data.frame(column = name, count = sum(!is.na(x)), mean = mean(x, na.rm = TRUE),
      median = median(x, na.rm = TRUE), sd = sd(x, na.rm = TRUE), row.names = NULL)
  }))
}

statlab_add_column <- function(data, name, values) {
  stopifnot(is.data.frame(data), length(values) %in% c(1L, nrow(data)))
  data[[name]] <- values
  data
}
