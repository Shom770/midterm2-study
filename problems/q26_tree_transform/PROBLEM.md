# Question 26: tree_transform

File: `solution.ml`

```
tree_transform
Lecture 9 wrote transform, which applies a function to every element of a
list. The same idea works for trees. Using the generic tree type from lecture 8, write

tree_transform : ('a -> 'b) -> 'a tree -> 'b tree

which applies f to every label of the tree and returns a tree of the
same shape.

tree_transform string_of_int Empty = Empty

tree_transform (fun (x : int) -> x * 2)
(Node (Node (Empty, 1, Empty), 2, Node (Empty, 3, Empty)))
= Node (Node (Empty, 2, Empty), 4, Node (Empty, 6, Empty))

tree_transform (fun (x : int) -> x > 1)
(Node (Empty, 1, Node (Empty, 2, Empty)))
= Node (Empty, false, Node (Empty, true, Empty))

The type variables 'a and 'b are different, so the result need not be a
tree of the same element type — only of the same shape. Nothing here
assumes a BST.
```
