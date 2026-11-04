# Question 1: contains_zero

File: `solution.ml`

```
contains_zero
Write

contains_zero : int list -> bool

which returns true exactly when 0 appears somewhere in the list.

contains_zero [1; 0; 2] = true
contains_zero [1; 2; 3] = false
contains_zero [] = false

Before you start, decide what the base case should return: does the empty list
contain a zero? Then combine the head's answer with the recursive answer for
the rest — || is the natural glue here (just as && is for
"every element..." questions).
Your score is based on the number of test cases that pass, so partial
solutions earn partial credit.
```
