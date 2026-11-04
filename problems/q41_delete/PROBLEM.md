# Question 41: delete

File: `linkedQueue.ml`

```
Homework 4, Problem 6: delete
Below is a cut-down linkedQueue.ml from Homework 4. At the top are the
queue's types and their invariant; then delete, whose body has been
replaced by failwith -- fill it in. Everything after delete is
provided (the other queue operations, which the tests use), and you don't
need to read or change it.
delete elt q mutates the queue q in place so that every node whose
value is structurally equal (=) to elt is removed. Do not build a new
queue: update the pointers inside q, and make sure the queue invariant
(see the comment at the top of the module) still holds afterwards -- think
about the empty queue, a queue whose only element is elt, and occurrences
at the head or at the tail.

(* q holds 1, 2, 2, 3 *) delete 2 q; to_list q = [1; 3]
(* q holds 1, 1 *) delete 1 q; to_list q = []

Your solution must be tail recursive: the tests run with a very small stack
and call delete on a queue of 1000 elements.
```
