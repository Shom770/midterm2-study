# Question 39: count_leaves

File: `solution.ml`

```
count_leaves
Using the binary tree type from lecture,

type tree =
| Empty
| Node of tree * int * tree

write

count_leaves : tree -> int

which counts the leaves of the tree. Recall the definition from lecture: a
leaf is a Node whose subtrees are both Empty. The empty tree has no
leaves.

count_leaves Empty = 0
count_leaves (Node (Empty, 7, Empty)) = 1
count_leaves (Node (Node (Empty, 1, Empty),
3,
Node (Empty, 2,
Node (Empty, 4, Empty)))) = 2

(In the last example the leaves are 1 and 4; the nodes 3 and 2 have at
least one nonempty subtree.)
```
