# Question 11: contains_alias and contains_alias_option

File: `imp.ml`

```
Homework 4, Problem 3: contains_alias and contains_alias_option
Below is a cut-down imp.ml from Homework 4. Fill in both functions,
whose bodies have been replaced by failwith:

contains_alias x l returns true if some element of the list l is an
alias of x -- the same value on the heap -- using reference equality
(==), not structural equality (=).
contains_alias_option x l does the same for a list of options: it returns
true if some Some v in l holds a v that is an alias of x. Nones
never match.

let r1 = { count = 5 } and r2 = { count = 5 } in
contains_alias r1 [r2] = false (* equal, not aliased *)
contains_alias r1 [r2; r1] = true
contains_alias_option r1 [None; Some r1] = true
contains_alias_option r1 [Some r2] = false
```
