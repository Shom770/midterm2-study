# Question 35: mutability and aliasing

File: `imp.ml`

```
Homework 4, Problem 2: mutability and aliasing
Below is a cut-down imp.ml from Homework 4. Fill in all four functions,
whose bodies have been replaced by failwith:

iter f l calls the side-effecting function f on each element of l, in
order. Do not use any List library functions.
state_incr r adds 1 to the count field of the record r and returns
the old value.
swap r1 r2 exchanges the count fields of r1 and r2.
states_aliased r1 r2 returns true exactly when r1 and r2 are the
same record on the heap (aliases), using reference equality (==).

let r = { count = 0 } in state_incr r = 0 && state_incr r = 1 && r.count = 2
let r1 = { count = 5 } in states_aliased r1 { count = 5 } = false
let r1 = { count = 5 } in states_aliased r1 r1 = true
```
