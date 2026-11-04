# Question 15: BSTSet.size

File: `treeSet.ml`

```
Homework 3, Problem 7: BSTSet.size
Below is treeSet.ml from Homework 3: an implementation of the
SET interface (setInterface.mli) using the binary search trees of
tree.ml (the Tree module is provided, already solved). The body of size
has been replaced by failwith. Fill it in.
size s returns the number of elements of the set s. There is no size
function in Tree, so write the recursion over the tree yourself.

size empty = 0
size (set_of_list [1; 2; 3; 5]) = 4
size (set_of_list [1; 2; 1; 1]) = 2

empty, list_of_set, add and set_of_list are provided, already solved;
the other functions are stubbed with failwith and are not needed for this
problem.
```
