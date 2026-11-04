# Question 38: parent_child_hamming

File: `dna.ml`

```
Homework 2, Problem 6: parent_child_hamming
Below is an excerpt of dna.ml from Homework 2: hamming_distance, the types evtree and labeled_evtree, and helix_of_evtree, all solved. The body of parent_child_hamming has been replaced by failwith. Fill it in.
parent_child_hamming t returns the sum, over every direct parent-child pair in the labeled tree t, of the Hamming distance between the parent's helix and the child's helix (use hamming_distance and helix_of_evtree).

parent_child_hamming (LLeaf [A]) = 0
parent_child_hamming
(LNode (LLeaf [G; T], [A; T], LNode (LLeaf [T; T], [T; T], LLeaf [C; G]))) = 4
```
