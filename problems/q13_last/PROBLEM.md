# Question 13: last

File: `solution.ml`

```
last
Write a function

last : int list -> int

that returns the last element of the list. There is no last element of
[], so on the empty list your function should instead call

failwith "empty"

(the grader checks for that exact message).

last [1; 2; 3] = 3
last [5] = 5
last [] (* raises Failure "empty" *)

The interesting case is a list with exactly one element. The nested pattern
[x] (equivalently x :: []) matches it, so a three-branch match —
empty list, one-element list, longer list — does the whole job.
```
