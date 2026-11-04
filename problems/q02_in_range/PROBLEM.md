# Question 2: in_range

File: `solution.ml`

```
in_range
Write

in_range : int -> int -> int -> bool

so that in_range lo hi x is true exactly when x lies between lo and
hi, inclusive of both endpoints.

in_range 1 10 5 = true
in_range 1 10 1 = true (* the endpoints count *)
in_range 1 10 10 = true
in_range 1 10 11 = false
in_range 10 1 5 = false (* an empty range contains nothing *)

You will not need if for this one: a comparison such as x >= lo is already a
bool, and &&, ||, and not combine bools into bigger bools.
Your score is based on the number of test cases that pass, so partial
solutions earn partial credit.
```
