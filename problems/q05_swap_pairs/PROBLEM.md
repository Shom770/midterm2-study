# Question 5: swap_pairs

File: `solution.ml`

```
swap_pairs
Write

swap_pairs : (int * string) list -> (string * int) list

which turns every pair in the list around, keeping the pairs in the same order.

swap_pairs [(1, "a"); (2, "b")] = [("a", 1); ("b", 2)]
swap_pairs [(7, "x")] = [("x", 7)]
swap_pairs [] = []

Read the type carefully before you start: the input is one list of pairs,
not a pair of lists. Your pattern for a non-empty list can take the head apart
in one go:

| (n, s) :: rest -> ...

Your score is based on the number of test cases that pass, so partial
solutions earn partial credit.
```
