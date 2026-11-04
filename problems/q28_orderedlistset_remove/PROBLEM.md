# Question 28: OrderedListSet.remove

File: `listSet.ml`

```
Homework 3, Problem 6: OrderedListSet.remove
Below is a cut-down listSet.ml from Homework 3: an implementation of a set
interface using sorted lists without duplicates. For this question the
interface SetInterface.SET has just four operations (listed at the top of
the file) instead of the homework's nine.
The body of remove has been replaced by failwith. Fill it in.
remove x s returns the set s without x (and just s if x is not an
element). Use the invariant that the list is sorted to short-circuit: stop
as soon as you pass the position where x would have to be. The tests check
this by breaking the abstraction, e.g. remove 2 [1; 3; 4; 2] must return
[1; 3; 4; 2] unchanged, and remove 2 [1; 2; 2; 2] must return [1; 2; 2].

remove 4 [1; 2; 3; 4] = [1; 2; 3]
remove 5 [1; 2; 3; 4] = [1; 2; 3; 4]

empty, list_of_set and member are provided, already solved.
```
