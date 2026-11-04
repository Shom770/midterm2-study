# Question 45: OrderedListSet.add

File: `listSet.ml`

```
Homework 3, Problem 6: OrderedListSet.add
Below is a cut-down listSet.ml from Homework 3: an implementation of a set
interface using sorted lists without duplicates. For this question the
interface SetInterface.SET has just four operations (listed at the top of
the file) instead of the homework's nine.
The body of add has been replaced by failwith. Fill it in.
add x s returns the set s with x added. The representation invariant
must be maintained: the list stays sorted in ascending order and contains no
duplicates. You may not use a sorting function.

add 3 [1; 2; 4] = [1; 2; 3; 4]
add 3 [1; 2; 3] = [1; 2; 3]

empty, list_of_set and set_of_list are provided, already solved. The
module is sealed by SetInterface.SET, and the tests also check the
representation invariant directly.
```
