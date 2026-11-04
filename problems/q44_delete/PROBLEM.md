# Question 44: delete

File: `tree.ml`

```
Homework 3, Problem 2: delete
Below is an excerpt of tree.ml from Homework 3 (binary search trees): the
tree type, the leaf helper, lookup, inorder and insert, the sample
trees the property tests run on, and delete with its body replaced by
failwith. Fill it in; write any helper function you need (the
homework hint is to first delete the maximum element of the left subtree).
delete x t returns a binary search tree that contains the same elements as
t except x. If x is not in t, the result is t itself. The result
must still be a valid BST.

delete 3 Empty = Empty
delete 2 (Node (leaf 2, 5, leaf 7)) = Node (Empty, 5, leaf 7)

lookup, inorder and insert are provided, already solved (the
property-based tests use them); leave them as they are.
```
