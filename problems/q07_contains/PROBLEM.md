# Question 7: contains

File: `linkedQueue.ml`

```
Homework 4, Problem 6: contains
Below is a cut-down linkedQueue.ml from Homework 4. At the top are the
queue's types and their invariant; then contains, whose body has been
replaced by failwith -- fill it in. Everything after contains is provided
(the other queue operations, which the tests use), and you don't need to read
or change it.
contains elt q returns true if some element of the queue q is the
same value on the heap as elt, comparing with reference equality
(==), not structural equality (=). It must not change the queue. Do not
use to_list: work on the linked nodes directly.

let r = ref 2 in (* q holds ref 1, r, ref 3 *)
contains r q = true
contains (ref 2) q = false (* a copy of r, not r itself *)

Your solution must be tail recursive: the tests run with a very small stack
and call contains on a queue of 1000 elements.
```
