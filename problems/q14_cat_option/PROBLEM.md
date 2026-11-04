# Question 14: cat_option

File: `imp.ml`

```
Homework 4, Problem 1: cat_option
Below is a cut-down imp.ml from Homework 4: fold, cat_option with its
body replaced by failwith, and the two functions the autograder uses with it,
transform and partial_transform, already written. Fill in cat_option
using fold (do not add rec, and do not use the List module).
cat_option l takes a list of optional values and returns the list of all the
values that are present, in order: strip off the Somes and drop the Nones.

cat_option [Some 1; None; Some 2; Some 0; None; None] = [1; 2; 0]
cat_option [None; None] = []
```
