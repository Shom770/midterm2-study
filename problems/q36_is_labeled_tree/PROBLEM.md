# Question 36: is_labeled_tree

File: `solution.ml`

```
is_labeled_tree
This problem compares two of the tree types you have seen: the generic
binary tree from lecture and Homework 3, and the labelled tree from
Homework 2, made generic (no Empty: a node has either zero children
(LLeaf) or two (LNode)).

to_labeled_tree, given in the editor, translates a tree into a
labeled_tree of the same shape — but it fails on some inputs. Write

is_labeled_tree : 'a tree -> bool

which returns true exactly when to_labeled_tree would succeed, and
false exactly when it would fail.

is_labeled_tree Empty = false
is_labeled_tree (Node (Empty, 1, Empty)) = true
is_labeled_tree (Node (Node (Empty, 1, Empty), 2, Empty)) = false

Your function must not call to_labeled_tree and must not catch the
exception; decide from the shape of the tree.
```
