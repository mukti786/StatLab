# Small, transparent teaching datasets. Synthetic records are labelled as such.
statlab_student_marks <- function() {
  data.frame(name = c("Asha", "Ravi", "Neha", "Arjun", "Mira"),
    marks = c(85, 72, 94, 81, 67), attendance = c(92, 84, 98, 88, 76))
}

statlab_monthly_expenses <- function() {
  data.frame(month = c("Jan", "Feb", "Mar", "Apr"), food = c(4200, 3900, 4600, 4100),
    travel = c(1800, 2100, 1600, 1900))
}
