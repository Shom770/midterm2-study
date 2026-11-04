# Question 24: count_leaves

File: `dna.ml`

```
Homework 2, Problem 4: count_leaves
Below is an excerpt of dna.ml from Homework 2: the evtree type, the (already filled-in) lesser_apes tree, and count_leaves, whose body has been replaced by failwith. Fill it in.
count_leaves t returns the number of Leaf nodes in the evolutionary tree t.

count_leaves (Leaf []) = 1
count_leaves (Node (Node (Leaf [], Leaf []), Leaf [])) = 3
count_leaves (lesser_apes ()) = 4
```
