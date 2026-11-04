# Question 34: insert_head and insert_tail

File: `deque.ml`

```
Homework 4, Problem 8: insert_head and insert_tail
Below is a cut-down deque.ml from Homework 4 (doubly linked deques): the
types and their invariant, then the two functions to write, then create
and to_list. Fill in both insert_head and insert_tail, whose bodies have
been replaced by failwith.
insert_head x q adds x as the new first element of the deque q;
insert_tail x q adds x as the new last element. Both update the deque in
place and must maintain the deque invariant described in the file (next and
prev pointers agree, the head's prev and the tail's next are None).
Remember that inserting into an empty deque must set both head and tail.

let d = create () in insert_head 2 d; insert_tail 3 d; insert_head 1 d;
to_list d = [1; 2; 3]
```
