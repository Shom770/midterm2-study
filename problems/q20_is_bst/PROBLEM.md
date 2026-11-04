# Question 20: is_bst

File: `solution.ml`

```
is_bst
Recall the binary search tree invariant:

Empty is a BST, and Node (lt, x, rt) is a BST if lt and rt are both
BSTs, all labels in lt are < x, and all labels in rt are > x.

is_bst t returns true exactly when t satisfies the invariant above.
Note that the inequalities are strict, so a tree containing the same label
twice is not a BST.

is_bst Empty = true
is_bst (Node (Node (Empty, 1, Empty), 5, Node (Empty, 9, Empty))) = true
is_bst (Node (Node (Empty, 9, Empty), 5, Node (Empty, 1, Empty))) = false
```
