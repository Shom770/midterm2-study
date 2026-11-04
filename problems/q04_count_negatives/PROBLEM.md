# Question 4: count_negatives

File: `solution.ml`

```
count_negatives
Write

count_negatives : int list -> int

which counts how many elements of the list are strictly less than zero.

count_negatives [1; -2; 3; -4] = 2
count_negatives [1; 2; 3] = 0
count_negatives [0] = 0 (* zero is not negative *)
count_negatives [] = 0

The shape is the same structural recursion as length from lecture; the only
difference is that the head element contributes 1 in some cases and 0 in
others. A conditional expression is one way to say that.
Your score is based on the number of test cases that pass, so partial
solutions earn partial credit.
```
