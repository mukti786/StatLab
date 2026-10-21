source("r/data_frames.R")
students <- data.frame(name = c("Asha", "Rahul", "Maya"), score = c(82, 75, 94))
statlab_filter_rows(students, "score", 80)
statlab_summarise_numeric(students)
