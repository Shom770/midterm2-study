# Question 42: simplest_evtree

File: `dna.ml`

```
Homework 2, Problem 7: simplest_evtree
Below is an excerpt of dna.ml from Homework 2, with everything the problem depends on already solved (hamming_distance, the labeled_evtree type, helix_of_evtree and parent_child_hamming). The body of simplest_evtree has been replaced by failwith. Fill it in.
simplest_evtree ts returns the simplest labeled tree in the (non-empty) list ts together with its complexity, where the complexity of a tree is parent_child_hamming of it. If several trees have the lowest complexity, return the one that appears first in the list. On the empty list, raise an error with failwith.

let t1 = LNode (LLeaf [A], [T], LLeaf [C])
let t2 = LNode (LLeaf [G; T], [A; T], LNode (LLeaf [T; T], [T; T], LLeaf [C; G]))
simplest_evtree [t2; t1] = (t1, 2)
simplest_evtree [t1; LLeaf [A]] = (LLeaf [A], 0)
```
