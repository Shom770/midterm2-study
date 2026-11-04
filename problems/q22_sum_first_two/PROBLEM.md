# Question 22: sum_first_two

File: `solution.ml`

```
sum_first_two
Write

sum_first_two : int list -> int

which adds up the first two elements of a list — and, if the list is
shorter than that, adds up whatever is there.

sum_first_two [3; 4; 5] = 7 (* only the first two *)
sum_first_two [3; 4] = 7
sum_first_two [7] = 7
sum_first_two [] = 0

This one is not recursive: no rec, no recursive call. It is a question
about patterns. Three shapes of list have to be told apart:

x :: y :: rest matches lists with at least two elements
[x] matches lists with exactly one element
[] matches the empty list
```
