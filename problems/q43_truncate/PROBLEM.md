# Question 43: truncate

File: `linkedQueue.ml`

```
Homework 4, Problem 6: truncate
Below is a cut-down linkedQueue.ml from Homework 4: the LinkedQueue
module with just the operations this problem uses -- valid (which checks
the invariant), create, enq, deq, to_list, length and contains,
already written. Fill in truncate, whose body has been replaced by
failwith.
truncate elt q mutates the queue q in place so that it is cut off after
the first occurrence of elt (compared with reference equality, ==):
all elements after that occurrence are removed and elt itself stays in the
queue. If elt does not occur, the queue is unchanged. Do not build a new
queue: update the pointers inside q, and make sure the queue invariant
(see the comment at the top of the module) still holds afterwards.

(* q holds 1, 2, 3, 4 *) truncate 2 q; to_list q = [1; 2]
(* q holds 1, 2, 3 *) truncate 5 q; to_list q = [1; 2; 3]

Your solution must be tail recursive: the tests run with a very small stack
and call truncate on a queue of 1000 elements.
```
