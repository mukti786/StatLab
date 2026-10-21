# Simple linear regression helpers using base R's lm().
statlab_fit_linear <- function(data, response, predictor) {
  stopifnot(is.data.frame(data), response %in% names(data), predictor %in% names(data))
  if (!is.numeric(data[[response]]) || !is.numeric(data[[predictor]]))
    stop("Response and predictor must both be numeric.")
  stats::lm(stats::reformulate(predictor, response), data = data)
}

statlab_predict_linear <- function(model, new_data) {
  stopifnot(inherits(model, "lm"), is.data.frame(new_data))
  predict(model, newdata = new_data, interval = "prediction")
}
