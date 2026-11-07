export type FundamentalsLesson = {
  title: string;
  summary: string;
  objective: string;
  explanation: string;
  code: string;
  expected: string;
  commonMistake: string;
  exercise: string;
};

export const fundamentalsLessons: FundamentalsLesson[] = [
  {
    title: 'What is R?', summary: 'A language for working with data', objective: 'Recognize R as a language and use it to calculate a result.',
    explanation: 'R is a programming language built for statistics and data work. It can calculate, transform, model, and visualize data. In StatLab, WebR runs R in this browser tab.',
    code: '2 + 3\nmean(c(2, 4, 8))', expected: 'The results are 5 and 4.666667.',
    commonMistake: 'R and RStudio are different: R is the language and runtime; RStudio is one desktop editor. StatLab uses WebR instead of a desktop installation.',
    exercise: 'Change one number and calculate the mean of a new vector.',
  },
  {
    title: 'Installing and understanding R', summary: 'Know the runtime you are using', objective: 'Inspect the current R version and understand where code executes.',
    explanation: 'A desktop installation of R is useful for projects that need local files or packages. StatLab does not install software: WebR runs a browser-compatible R build through WebAssembly.',
    code: 'R.version.string\n.Platform$OS.type', expected: 'R prints its version string and reports the WebAssembly platform type.',
    commonMistake: 'A browser runtime is not identical to desktop R: operating-system commands and packages requiring native system libraries may be unavailable.',
    exercise: 'Run the code and compare the runtime version shown here with an R version on a computer you use.',
  },
  {
    title: 'R syntax', summary: 'Expressions, comments, and names', objective: 'Write simple expressions and use comments to explain code.',
    explanation: 'R evaluates expressions from top to bottom. A line beginning with # is a comment and is ignored by R. Names can contain letters, numbers, dots, and underscores, but cannot start with a digit.',
    code: '# R evaluates each expression\n4 * 5\n(3 + 2) ^ 2', expected: 'The results are 20 and 25.',
    commonMistake: 'R is case-sensitive: score, Score, and SCORE are three different names.',
    exercise: 'Add a comment, then write an expression that evaluates to 100.',
  },
  {
    title: 'Variables and assignment', summary: 'Give values useful names', objective: 'Assign values with <- and use them in later expressions.',
    explanation: 'Use <- to assign a value to a name. Assignment stores the result so you can reuse it instead of repeating the calculation.',
    code: 'price <- 12\nquantity <- 4\ntotal <- price * quantity\ntotal', expected: 'total is 48.',
    commonMistake: 'Use <- for assignment and == to compare values. A single = is also accepted in many assignments, but <- is the common teaching style.',
    exercise: 'Create a tax variable and calculate the total after adding it to price.',
  },
  {
    title: 'Data types', summary: 'Numbers, text, and logical values', objective: 'Identify numeric, character, logical, and missing values.',
    explanation: 'Common atomic types include double numbers, integers (written with an L suffix), character strings, and logical TRUE/FALSE values. NA represents a missing value.',
    code: 'typeof(3.5)\ntypeof(3L)\ntypeof("hello")\ntypeof(TRUE)\nis.na(NA)', expected: 'R reports double, integer, character, and logical; the final result is TRUE.',
    commonMistake: 'The text "NA" is a two-character string. NA without quotes is a missing value.',
    exercise: 'Use typeof() to inspect 42L and "42".',
  },
  {
    title: 'Operators', summary: 'Calculate and compare values', objective: 'Use arithmetic, comparison, and logical operators.',
    explanation: 'Arithmetic includes +, -, *, /, and ^. Comparisons such as >= return TRUE or FALSE. Combine conditions with &, |, and !.',
    code: '12 %% 5\n12 %/% 5\n7 >= 5\n(7 >= 5) & (2 < 4)', expected: 'The results are 2, 2, TRUE, and TRUE.',
    commonMistake: '%/% is integer-style division and %% is the remainder. They are different from ordinary division with /.',
    exercise: 'Check whether 18 is divisible by 3 using %% and ==.',
  },
  {
    title: 'Strings', summary: 'Work with character data', objective: 'Create strings and combine or inspect them.',
    explanation: 'Put text in single or double quotes. paste() joins values with a separator; nchar() counts characters.',
    code: 'first <- "Stat"\nsecond <- "Lab"\npaste(first, second, sep = "")\nnchar("data")', expected: 'The result is "StatLab" and the character count is 4.',
    commonMistake: 'Numbers inside quotes are text, so arithmetic requires converting them with as.numeric().',
    exercise: 'Join your first and last name with a space, then count the characters.',
  },
  {
    title: 'Vectors', summary: 'Store a sequence of values', objective: 'Create, index, and calculate over a vector.',
    explanation: 'A vector is an ordered collection of values with one atomic type. c() combines values. R indexing starts at 1, and vectorized operations apply to each element.',
    code: 'scores <- c(72, 85, 91)\nscores[2]\nscores + 5\nmean(scores)', expected: 'The second score is 85; adding 5 gives 77, 90, 96; the mean is 82.66667.',
    commonMistake: 'The first element is scores[1], not scores[0]. Index 0 selects no elements.',
    exercise: 'Create a vector of four numbers and select its first and last values.',
  },
  {
    title: 'Lists', summary: 'Combine values of different types', objective: 'Create a list and select named elements.',
    explanation: 'A list can hold elements with different types or sizes. Use $ with a name or [[ ]] to extract one element.',
    code: 'student <- list(name = "Maya", score = 91, passed = TRUE)\nstudent$name\nstudent[[2]]', expected: 'R returns "Maya" and 91.',
    commonMistake: 'student["score"] returns a one-element list; student[["score"]] returns the number inside it.',
    exercise: 'Add a vector of three quiz scores to a list and extract its mean.',
  },
  {
    title: 'Matrices', summary: 'Arrange same-type data in two dimensions', objective: 'Create a matrix and use row and column indexing.',
    explanation: 'matrix() stores same-type values in rows and columns. By default, R fills down columns first. Use [row, column] to select a cell.',
    code: 'm <- matrix(1:6, nrow = 2)\nm\nm[2, 3]\nrowSums(m)', expected: 'The matrix has 2 rows; m[2, 3] is 6 and the row sums are 9 and 12.',
    commonMistake: 'R fills a matrix by column unless byrow = TRUE is specified.',
    exercise: 'Make a 2 by 2 matrix from 1:4 and display its transpose with t().',
  },
  {
    title: 'Arrays', summary: 'Extend matrices to more dimensions', objective: 'Create and inspect a three-dimensional array.',
    explanation: 'An array is a multi-dimensional collection of one type. The dim argument sets the size along each dimension.',
    code: 'a <- array(1:12, dim = c(2, 3, 2))\ndim(a)\na[2, 3, 2]', expected: 'The dimensions are 2, 3, 2; the selected value is 12.',
    commonMistake: 'The product of the dimensions must match the number of values, or R recycles values with a warning when lengths do not divide evenly.',
    exercise: 'Create an array with dimensions 2 by 2 by 2 and inspect its dimensions.',
  },
  {
    title: 'Factors', summary: 'Represent categorical values', objective: 'Create a factor and inspect its levels.',
    explanation: 'A factor stores categories using a set of levels. Factors are useful for grouping and modeling categorical data.',
    code: 'sizes <- factor(c("small", "large", "small"), levels = c("small", "large"))\nlevels(sizes)\ntable(sizes)', expected: 'The levels are small and large; the table counts two small and one large.',
    commonMistake: 'A factor is not just a character vector. Convert to character before editing labels as text.',
    exercise: 'Create a factor for three colors and count the observations in each level.',
  },
  {
    title: 'Data frames', summary: 'Store observations in rows and variables in columns', objective: 'Create a data frame and select a column.',
    explanation: 'A data frame is a rectangular table. Each column can have its own type, but every column must have the same number of rows.',
    code: 'students <- data.frame(name = c("Asha", "Ravi"), score = c(85, 72))\nstudents$score\nmean(students$score)', expected: 'The score column is 85, 72; its mean is 78.5.',
    commonMistake: 'Use $ or [[ ]] for one column. A single bracket such as students["score"] keeps the result as a data frame.',
    exercise: 'Add an attendance column and calculate its mean.',
  },
  {
    title: 'Conditional statements', summary: 'Choose code based on a condition', objective: 'Use if and else to return a result.',
    explanation: 'An if statement runs a block only when a single logical condition is TRUE. Use else for the alternative path.',
    code: 'score <- 78\nif (score >= 50) {\n  "pass"\n} else {\n  "retry"\n}', expected: 'The result is "pass".',
    commonMistake: 'Use && for a single if condition. & compares element-by-element and can return multiple logical values.',
    exercise: 'Write an if/else expression that labels a score of 80 or more as "high".',
  },
  {
    title: 'Loops', summary: 'Repeat a calculation', objective: 'Use a for loop to accumulate values.',
    explanation: 'A for loop visits each value in a sequence. Pre-allocate results when building a long vector, rather than repeatedly growing it.',
    code: 'total <- 0\nfor (value in 1:5) {\n  total <- total + value\n}\ntotal', expected: 'The sum is 15.',
    commonMistake: 'The loop body must be inside braces if it contains multiple expressions.',
    exercise: 'Change the loop so it adds the integers from 1 through 10.',
  },
  {
    title: 'Functions', summary: 'Package a reusable calculation', objective: 'Define a function with an argument and return value.',
    explanation: 'Use function() to define a function. In R, the last expression is returned automatically; return() is available when an early return is needed.',
    code: 'rectangle_area <- function(width, height) {\n  width * height\n}\nrectangle_area(4, 6)', expected: 'The area is 24.',
    commonMistake: 'A function does not run when it is defined. Call it with arguments to get a result.',
    exercise: 'Write a function that converts minutes to seconds.',
  },
  {
    title: 'Packages', summary: 'Extend base R with reusable code', objective: 'Understand package loading without assuming installation access.',
    explanation: 'Packages bundle functions, documentation, and data. Desktop R commonly uses install.packages() once and library() in each session. This browser runtime has a fixed set of available packages and does not install arbitrary CRAN packages.',
    code: 'search()\nmean(c(3, 6, 9))', expected: 'search() lists attached environments; mean() returns 6.',
    commonMistake: 'install.packages() needs repository access and a compatible WebAssembly build. Do not assume every desktop package can load in WebR.',
    exercise: 'Run the code and identify which environments are attached in this R session.',
  },
  {
    title: 'Import and export data', summary: 'Read tabular text with base R', objective: 'Read a small CSV string into a data frame.',
    explanation: 'Desktop R can read local files with read.csv("file.csv"). In this browser sandbox, use the Dataset Explorer to import local CSV files, or use textConnection() for a self-contained example.',
    code: 'csv_text <- "name,score\\nAsha,85\\nRavi,72"\nstudents <- read.csv(text = csv_text)\nstr(students)\nmean(students$score)', expected: 'R reads two rows and the mean score is 78.5.',
    commonMistake: 'A browser WebAssembly filesystem is separate from your computer’s files. Use the local CSV upload in Dataset Explorer to inspect your own file.',
    exercise: 'Add a third row to csv_text and calculate the new mean.',
  },
  {
    title: 'Basic data manipulation', summary: 'Filter, sort, and add columns', objective: 'Select rows and create a derived variable.',
    explanation: 'Base R can filter rows with subset(), sort with order(), and add a column by assigning with $. These operations make the transformation explicit.',
    code: 'students <- data.frame(name = c("Asha", "Ravi", "Neha"), score = c(85, 72, 94))\nhigh <- subset(students, score >= 80)\nhigh[order(high$score), ]', expected: 'The result contains Asha and Neha sorted by score ascending.',
    commonMistake: 'Use a comma in data-frame indexing: data[rows, columns]. Leaving a position blank means select all.',
    exercise: 'Add a passed column that is TRUE when score is at least 80.',
  },
  {
    title: 'Introduction to statistics', summary: 'Describe a sample before modeling it', objective: 'Calculate center and spread and explain what they summarize.',
    explanation: 'The mean and median describe center; range, IQR, and standard deviation describe spread in different ways. These are summaries of the observed values, not guarantees about every future observation.',
    code: 'scores <- c(65, 78, 82, 91, 74)\nmean(scores)\nmedian(scores)\nsd(scores)\nIQR(scores)', expected: 'Mean is 78; median is 78; sample SD is about 9.77; IQR is 8.',
    commonMistake: 'sd() and var() in R use sample formulas with denominator n - 1. Do not confuse sample SD with a population SD.',
    exercise: 'Add a low outlier and compare how the mean and median change.',
  },
];
