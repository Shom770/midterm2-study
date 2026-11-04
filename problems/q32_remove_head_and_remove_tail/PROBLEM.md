# Question 32: remove_head and remove_tail

File: `deque.ml`

```
Homework 4, Problem 8: remove_head and remove_tail
Below is a cut-down deque.ml from Homework 4 (doubly linked deques): the
types and their invariant, then the two functions to write, then create,
is_empty and to_list. Fill in both remove_head and remove_tail,
whose bodies have been replaced by failwith.
remove_head q removes the first element of the deque q and returns it;
remove_tail q removes and returns the last element. Both should fail (raise
an exception, e.g. with failwith) if the deque is empty. Both update the
deque in place and must maintain the deque invariant described in the file
(next and prev pointers agree, the head's prev and the tail's next are
None). Remember that removing the only element must leave both head and
tail as None.

(* d holds 1, 2, 3 *) remove_head d = 1; remove_tail d = 3; to_list d = [2]
```
