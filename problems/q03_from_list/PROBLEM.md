# Question 3: from_list

File: `linkedQueue.ml`

```
Homework 4, Problem 6: from_list
Below is a cut-down linkedQueue.ml from Homework 4. At the top are the
queue's types and their invariant, and the two queue operations you may want
to use, create and enq; then from_list, whose body has been replaced by
failwith -- fill it in. Everything after from_list is provided (the other
queue operations, which the tests use), and you don't need to read or change
it.
from_list l converts a list [v1; v2; ...; vn] into a new queue with v1
at the head and vn at the tail. Do not use any List library functions.

let q = from_list [1; 2; 3] in deq q = Some 1 (* q now holds 2, 3 *)
from_list [] is an empty queue

Your solution must be tail recursive: the tests run with a very small stack
and call from_list on a list of 1000 elements.
```
