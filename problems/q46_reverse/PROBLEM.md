# Question 46: reverse

File: `deque.ml`

```
Homework 4, Problem 8: reverse
Below is a cut-down deque.ml from Homework 4 (doubly linked deques): the types and their invariant, create and to_list. Fill in reverse, whose body has been replaced by failwith.
reverse q mutates the deque q in place so that the order of its elements is reversed. In place means that after the call the deque consists of the same dqnodes as before (the old tail node is now the head node, and so on) -- do not remove the elements and re-insert them. The result must satisfy the deque invariant.

let d = from 1,2,3 in reverse d; to_list d = [3; 2; 1]

Your solution must be tail recursive: the tests run with a very small stack and call reverse on a deque of 1000 elements.
```
